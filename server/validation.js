import { canonicalUrl } from "./db.js";
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export function text(value, label, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(400, `${label} must contain ${min}–${max} characters.`);
  return value.trim();
}
export function email(value) {
  const result = text(value, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    fail(400, "Enter a valid email address.");
  return result;
}
export function password(value) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128)
    fail(400, "Use a password with 12–128 characters.");
  return value;
}
export function url(value, label = "Resource link") {
  const input = text(value, label, 8, 2048);
  try {
    return canonicalUrl(input);
  } catch {
    fail(
      400,
      `${label} must be a valid HTTP or HTTPS URL without login credentials.`,
    );
  }
}
export function integer(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max)
    fail(400, `${label} must be an integer between ${min} and ${max}.`);
  return value;
}
export function uuid(value) {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value))
    fail(400, "Invalid identifier.");
  return value;
}
function stringList(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 12)
    fail(400, `${label} must contain at most 12 items.`);
  return [...new Set(value.map((item) => text(item, label, 1, 80)))];
}
export function resource(body) {
  if (!["video", "book"].includes(body.type))
    fail(400, "Choose a course or book.");
  const link = url(body.url);
  let thumbnail = null;
  const parsed = new URL(link);
  if (
    body.type === "video" &&
    parsed.hostname === "www.youtube.com" &&
    parsed.searchParams.get("v")
  )
    thumbnail = `https://img.youtube.com/vi/${encodeURIComponent(parsed.searchParams.get("v"))}/hqdefault.jpg`;
  return {
    title: text(body.title, "Title", 3, 200),
    type: body.type,
    subject: text(body.subject, "Discipline", 1, 20),
    provider: text(body.provider, "Educator or author", 2, 160),
    url: link,
    description: text(
      body.description,
      "Why this resource is useful",
      20,
      2000,
    ),
    topics: stringList(body.topics, "Topics"),
    tags: stringList(body.tags, "Tags"),
    videos: body.videos ? text(body.videos, "Length", 1, 60) : null,
    notesUrl: body.notesUrl ? url(body.notesUrl, "Notes link") : null,
    thumbnail,
  };
}
