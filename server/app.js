import express from "express";
import { fileURLToPath } from "node:url";
import { transaction } from "./db.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  digest,
  sessionToken,
  publicUser,
  permissions,
} from "./auth.js";
import {
  HttpError,
  fail,
  text,
  email,
  password,
  integer,
  resource,
  uuid,
} from "./validation.js";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
const toResource = (row) => ({
  id: row.id,
  title: row.title,
  type: row.type,
  subject: row.discipline_id,
  provider: row.provider,
  url: row.url,
  thumb: row.thumbnail_url,
  videos: row.duration_label || "Video course",
  topics: row.topics,
  tags: row.tags,
  description: row.description,
  notes: row.notes_url
    ? { url: row.notes_url, label: row.notes_label || "Course notes" }
    : null,
  status: row.status,
  published: row.published,
  submittedBy: row.author_name || null,
  createdAt: row.created_at,
  reviewNote: row.review_note,
});
export function createApp(
  pool,
  {
    origin = process.env.APP_ORIGIN || "http://127.0.0.1:3000",
    production = process.env.NODE_ENV === "production",
    rateLimit = true,
  } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    res.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://img.youtube.com data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
    );
    if (production) res.set("Strict-Transport-Security", "max-age=31536000");
    next();
  });
  app.use("/api", express.json({ limit: "32kb" }));
  app.use("/api", (req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.body === undefined) req.body = {};
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
        return next(
          new HttpError(400, "Send a JSON object as the request body."),
        );
    }
    next();
  });
  const attempts = new Map();
  const limiter = setInterval(() => {
    for (const [key, bucket] of attempts)
      if (bucket.until < Date.now()) attempts.delete(key);
  }, 60000);
  limiter.unref();
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") &&
      req.get("origin") !== origin
    )
      return next(
        new HttpError(
          403,
          "This request came from a different site. Refresh and try again.",
        ),
      );
    if (rateLimit && req.method !== "GET") {
      const auth = req.path.startsWith("/auth");
      const key = `${req.ip}:${auth ? "auth" : "write"}`;
      let bucket = attempts.get(key);
      if (!bucket || bucket.until < Date.now()) {
        bucket = { count: 0, until: Date.now() + 15 * 60 * 1000 };
        attempts.set(key, bucket);
      }
      if (++bucket.count > (auth ? 30 : 150)) {
        res.set("Retry-After", Math.ceil((bucket.until - Date.now()) / 1000));
        return next(
          new HttpError(429, "Too many attempts. Try again in a few minutes."),
        );
      }
    }
    next();
  });
  app.use("/api", async (req, res, next) => {
    try {
      req.policy = (
        await pool.query("SELECT * FROM credit_policy WHERE id=1")
      ).rows[0];
      if (!req.policy) throw new Error("Database migrations are missing.");
      const token = sessionToken(req);
      if (token) {
        const result = await pool.query(
          "SELECT u.*,s.csrf_token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()",
          [digest(token)],
        );
        if (result.rowCount) {
          req.user = result.rows[0];
          req.csrfToken = req.user.csrf_token;
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  });
  const requireUser = (req, res, next) =>
    req.user ? next() : next(new HttpError(401, "Sign in to continue."));
  const csrf = (req, res, next) =>
    req.get("x-csrf-token") === req.csrfToken
      ? next()
      : next(
          new HttpError(
            403,
            "Your session changed. Refresh the page and try again.",
          ),
        );
  const requireAdmin = (req, res, next) =>
    req.user?.role === "admin"
      ? next()
      : next(new HttpError(403, "Only an admin can do this."));
  const requireReviewer = (req, res, next) =>
    permissions(req.user, req.policy).canReview
      ? next()
      : next(
          new HttpError(
            403,
            "You have not reached the reviewing credit threshold.",
          ),
        );
  const audit = (client, actor, action, details) =>
    client.query(
      "INSERT INTO audit_log(actor_id,action,details) VALUES($1,$2,$3)",
      [actor, action, JSON.stringify(details)],
    );

  app.get("/api/health", async (req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.get("/api/me", (req, res) =>
    res.json({
      user: req.user ? publicUser(req.user, req.policy) : null,
      csrfToken: req.csrfToken || null,
      policy: req.policy,
    }),
  );
  app.get("/api/catalog", async (req, res) => {
    const [subjects, items] = await Promise.all([
      pool.query(
        "SELECT id,label,description AS desc FROM disciplines ORDER BY position",
      ),
      pool.query(
        "SELECT r.*,u.name AS author_name FROM resources r LEFT JOIN users u ON u.id=r.submitted_by WHERE r.published=true ORDER BY r.sort_order,r.created_at,r.id",
      ),
    ]);
    res.json({
      subjects: subjects.rows,
      resources: items.rows.map(toResource),
    });
  });
  app.post("/api/auth/register", async (req, res) => {
    const name = text(req.body.name, "Name", 2, 80),
      address = email(req.body.email),
      secret = password(req.body.password);
    const hash = await hashPassword(secret);
    const user = (
      await pool.query(
        "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING *",
        [name, address, hash],
      )
    ).rows[0];
    const csrfToken = await createSession(pool, user.id, res, production);
    res.status(201).json({
      user: publicUser(user, req.policy),
      csrfToken,
      policy: req.policy,
    });
  });
  app.post("/api/auth/login", async (req, res) => {
    const address = email(req.body.email),
      secret = password(req.body.password);
    const user = (
      await pool.query("SELECT * FROM users WHERE email=$1", [address])
    ).rows[0];
    // Apply the same password derivation work for unknown addresses.
    const valid = await verifyPassword(
      secret,
      user?.password_hash || `${"0".repeat(32)}:${"0".repeat(128)}`,
    );
    if (!user || !valid) fail(401, "Email or password is incorrect.");
    const old = sessionToken(req);
    if (old)
      await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(old),
      ]);
    const csrfToken = await createSession(pool, user.id, res, production);
    res.json({
      user: publicUser(user, req.policy),
      csrfToken,
      policy: req.policy,
    });
  });
  app.post("/api/auth/logout", requireUser, csrf, async (req, res) => {
    await pool.query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(sessionToken(req)),
    ]);
    res.clearCookie("ev_session", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: production,
    });
    res.json({ ok: true });
  });
  app.post("/api/resources", requireUser, csrf, async (req, res) => {
    const item = resource(req.body);
    const result = await transaction(pool, async (client) => {
      const policy = (
        await client.query("SELECT * FROM credit_policy WHERE id=1 FOR SHARE")
      ).rows[0];
      const actor = (
        await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
          req.user.id,
        ])
      ).rows[0];
      if (
        !(
          await client.query("SELECT 1 FROM disciplines WHERE id=$1", [
            item.subject,
          ])
        ).rowCount
      )
        fail(400, "Choose an existing discipline.");
      const published = permissions(actor, policy).canPostDirectly;
      const row = (
        await client.query(
          `INSERT INTO resources(title,type,discipline_id,provider,url,thumbnail_url,duration_label,topics,tags,notes_url,description,submitted_by,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
          [
            item.title,
            item.type,
            item.subject,
            item.provider,
            item.url,
            item.thumbnail,
            item.videos,
            JSON.stringify(item.topics),
            JSON.stringify(item.tags),
            item.notesUrl,
            item.description,
            actor.id,
            published,
          ],
        )
      ).rows[0];
      await audit(client, actor.id, "resource.submitted", {
        resourceId: row.id,
        published,
      });
      return row;
    });
    res.status(201).json({
      resource: toResource(result),
      message: result.published
        ? "Published. A reviewer will check it before credits are awarded."
        : "Submitted for review. It will appear in the library when approved.",
    });
  });
  app.get("/api/account", requireUser, async (req, res) => {
    const [items, ledger] = await Promise.all([
      pool.query(
        "SELECT * FROM resources WHERE submitted_by=$1 ORDER BY created_at DESC",
        [req.user.id],
      ),
      pool.query(
        "SELECT delta,reason,created_at FROM credit_ledger WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",
        [req.user.id],
      ),
    ]);
    res.json({
      user: publicUser(req.user, req.policy),
      policy: req.policy,
      submissions: items.rows.map(toResource),
      ledger: ledger.rows,
    });
  });
  app.get("/api/reviews", requireUser, requireReviewer, async (req, res) => {
    const rows = (
      await pool.query(
        "SELECT r.*,u.name AS author_name FROM resources r JOIN users u ON u.id=r.submitted_by WHERE r.status='pending' AND r.submitted_by<>$1 ORDER BY r.created_at",
        [req.user.id],
      )
    ).rows;
    res.json({ resources: rows.map(toResource) });
  });
  app.post(
    "/api/reviews/:id",
    requireUser,
    csrf,
    requireReviewer,
    async (req, res) => {
      const id = uuid(req.params.id),
        decision = req.body.decision;
      if (!["approved", "rejected"].includes(decision))
        fail(400, "Choose approve or reject.");
      const reason = text(req.body.reason, "Review explanation", 5, 1000);
      const result = await transaction(pool, async (client) => {
        const policy = (
          await client.query("SELECT * FROM credit_policy WHERE id=1 FOR SHARE")
        ).rows[0];
        const item = (
          await client.query("SELECT * FROM resources WHERE id=$1 FOR UPDATE", [
            id,
          ])
        ).rows[0];
        if (!item) fail(404, "Resource not found.");
        if (item.submitted_by === req.user.id)
          fail(403, "You cannot review your own submission.");
        if (item.status !== "pending")
          fail(409, "This resource has already been reviewed.");
        const users = (
          await client.query(
            "SELECT * FROM users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
            [[req.user.id, item.submitted_by]],
          )
        ).rows;
        const actor = users.find((user) => user.id === req.user.id);
        if (!permissions(actor, policy).canReview)
          fail(403, "Your reviewing permission has changed. Refresh the page.");
        await client.query(
          "INSERT INTO reviews(resource_id,reviewer_id,decision,reason) VALUES($1,$2,$3,$4)",
          [id, actor.id, decision, reason],
        );
        const row = (
          await client.query(
            "UPDATE resources SET status=$2,published=$3,reviewed_at=now(),review_note=$4 WHERE id=$1 RETURNING *",
            [id, decision, decision === "approved", reason],
          )
        ).rows[0];
        if (decision === "approved" && item.submitted_by) {
          await client.query(
            "INSERT INTO credit_ledger(user_id,resource_id,actor_id,delta,reason,kind) VALUES($1,$2,$3,$4,$5,'approval')",
            [
              item.submitted_by,
              id,
              actor.id,
              policy.approval_award,
              `Approved: ${item.title}`,
            ],
          );
          await client.query(
            "UPDATE users SET credits=credits+$2 WHERE id=$1",
            [item.submitted_by, policy.approval_award],
          );
        }
        await audit(client, actor.id, `resource.${decision}`, {
          resourceId: id,
          reason,
          credits: decision === "approved" ? policy.approval_award : 0,
        });
        return row;
      });
      res.json({ resource: toResource(result) });
    },
  );
  app.get("/api/admin", requireUser, requireAdmin, async (req, res) => {
    const [users, log, counts] = await Promise.all([
      pool.query(
        "SELECT id,name,email,credits,role FROM users ORDER BY created_at DESC LIMIT 200",
      ),
      pool.query(
        "SELECT a.action,a.details,a.created_at,u.name AS actor FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 50",
      ),
      pool.query(
        "SELECT count(*)::int AS total,count(*) FILTER(WHERE status='pending')::int AS pending FROM resources",
      ),
    ]);
    res.json({
      policy: req.policy,
      users: users.rows.map((user) => publicUser(user, req.policy)),
      audit: log.rows,
      counts: counts.rows[0],
    });
  });
  app.put(
    "/api/admin/policy",
    requireUser,
    csrf,
    requireAdmin,
    async (req, res) => {
      const award = integer(req.body.approvalAward, "Approval award", 0, 1000),
        posting = integer(
          req.body.postingThreshold,
          "Posting threshold",
          0,
          1000000,
        ),
        reviewing = integer(
          req.body.reviewingThreshold,
          "Reviewing threshold",
          0,
          1000000,
        );
      const policy = await transaction(pool, async (client) => {
        const before = (
          await client.query(
            "SELECT * FROM credit_policy WHERE id=1 FOR UPDATE",
          )
        ).rows[0];
        const after = (
          await client.query(
            "UPDATE credit_policy SET approval_award=$1,posting_threshold=$2,reviewing_threshold=$3,updated_at=now() WHERE id=1 RETURNING *",
            [award, posting, reviewing],
          )
        ).rows[0];
        await audit(client, req.user.id, "policy.updated", { before, after });
        return after;
      });
      res.json({ policy });
    },
  );
  app.post(
    "/api/admin/users/:id/credits",
    requireUser,
    csrf,
    requireAdmin,
    async (req, res) => {
      const id = uuid(req.params.id),
        delta = integer(req.body.delta, "Credit adjustment", -1000000, 1000000),
        reason = text(req.body.reason, "Adjustment reason", 5, 1000);
      if (!delta) fail(400, "The credit adjustment cannot be zero.");
      const user = await transaction(pool, async (client) => {
        const before = (
          await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [id])
        ).rows[0];
        if (!before) fail(404, "User not found.");
        if (before.credits + delta < 0 || before.credits + delta > 100000000)
          fail(
            400,
            "The resulting credit balance must be between 0 and 100,000,000.",
          );
        const after = (
          await client.query(
            "UPDATE users SET credits=credits+$2 WHERE id=$1 RETURNING *",
            [id, delta],
          )
        ).rows[0];
        await client.query(
          "INSERT INTO credit_ledger(user_id,actor_id,delta,reason,kind) VALUES($1,$2,$3,$4,'adjustment')",
          [id, req.user.id, delta, reason],
        );
        await audit(client, req.user.id, "credits.adjusted", {
          userId: id,
          delta,
          reason,
        });
        return after;
      });
      res.json({ user: publicUser(user, req.policy) });
    },
  );
  app.post(
    "/api/admin/resources/:id/withdraw",
    requireUser,
    csrf,
    requireAdmin,
    async (req, res) => {
      const id = uuid(req.params.id),
        reason = text(req.body.reason, "Removal reason", 5, 1000);
      await transaction(pool, async (client) => {
        const item = (
          await client.query("SELECT * FROM resources WHERE id=$1 FOR UPDATE", [
            id,
          ])
        ).rows[0];
        if (!item) fail(404, "Resource not found.");
        if (!item.published) fail(409, "This resource is already hidden.");
        const earned =
          (
            await client.query(
              "SELECT delta FROM credit_ledger WHERE resource_id=$1 AND kind='approval'",
              [id],
            )
          ).rows[0]?.delta || 0;
        if (item.submitted_by && earned) {
          const user = (
            await client.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
              item.submitted_by,
            ])
          ).rows[0];
          const reversal = Math.min(user.credits, earned);
          await client.query(
            "UPDATE users SET credits=credits-$2 WHERE id=$1",
            [user.id, reversal],
          );
          await client.query(
            "INSERT INTO credit_ledger(user_id,resource_id,actor_id,delta,reason,kind) VALUES($1,$2,$3,$4,$5,'adjustment')",
            [
              user.id,
              id,
              req.user.id,
              -reversal,
              `Removed resource: ${reason}`,
            ],
          );
        }
        await client.query(
          "UPDATE resources SET published=false,status='rejected',reviewed_at=now(),review_note=$2 WHERE id=$1",
          [id, reason],
        );
        await audit(client, req.user.id, "resource.withdrawn", {
          resourceId: id,
          reason,
        });
      });
      res.json({ ok: true });
    },
  );
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use(
    express.static(publicDirectory, { index: "index.html", dotfiles: "deny" }),
  );
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = error.status || 500,
      message = error.message;
    if (error.code === "23505") {
      status = 409;
      message =
        error.constraint === "users_email_key"
          ? "An account with this email already exists."
          : "This resource link has already been submitted.";
    }
    if (error.type === "entity.parse.failed") {
      status = 400;
      message = "The request body must be valid JSON.";
    }
    if (status >= 500) {
      console.error("Request failed:", error.code || error.name);
      message = "The service is unavailable. Try again shortly.";
    }
    res.status(status).json({ error: message });
  });
  return app;
}
