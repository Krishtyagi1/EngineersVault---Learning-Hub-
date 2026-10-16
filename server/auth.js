import {
  randomBytes,
  scrypt as deriveKey,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(deriveKey);
export const digest = (token) =>
  createHash("sha256").update(token).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(":");
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return expected.length === key.length && timingSafeEqual(expected, key);
}
export function permissions(user, policy) {
  const admin = user.role === "admin";
  return {
    admin,
    canPostDirectly: admin || user.credits >= policy.posting_threshold,
    canReview: admin || user.credits >= policy.reviewing_threshold,
  };
}
export function publicUser(user, policy) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    role: user.role,
    ...permissions(user, policy),
  };
}
export async function createSession(pool, userId, res, production) {
  const token = randomBytes(32).toString("hex"),
    csrfToken = randomBytes(32).toString("hex");
  await pool.query(
    "INSERT INTO sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '7 days')",
    [digest(token), userId, csrfToken],
  );
  res.cookie("ev_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return csrfToken;
}
export function sessionToken(req) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("ev_session="))
    ?.slice(11);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
