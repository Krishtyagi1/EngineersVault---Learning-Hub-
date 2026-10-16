import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { resolve, relative } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { randomUUID, randomBytes } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import { createPool, migrate, seed, canonicalUrl } from "../server/db.js";
import { createApp } from "../server/app.js";

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
test(
  "PostgreSQL community flow, credit rules, access control, and concurrent review",
  { timeout: 120000 },
  async (t) => {
    const base = resolve(".local"),
      directory = resolve(base, `test-${randomUUID()}`),
      secret = randomBytes(20).toString("hex"),
      port = await freePort();
    await mkdir(base, { recursive: true });
    const postgres = new EmbeddedPostgres({
      databaseDir: directory,
      user: "ev_test",
      password: secret,
      port,
      persistent: true,
      authMethod: "scram-sha-256",
      postgresFlags: ["-h", "127.0.0.1"],
      initdbFlags: ["--encoding=UTF8", "--locale=C"],
      onLog: () => {},
      onError: () => {},
    });
    let pool, server;
    t.after(async () => {
      if (server) await new Promise((resolve) => server.close(resolve));
      if (pool) await pool.end();
      await postgres.stop();
      if (!relative(base, directory).startsWith("test-"))
        throw new Error("Unsafe test cleanup path.");
      await rm(directory, { recursive: true, force: true });
    });
    await postgres.initialise();
    await postgres.start();
    pool = createPool(
      `postgresql://ev_test:${secret}@127.0.0.1:${port}/postgres`,
    );
    await migrate(pool);
    await migrate(pool);
    await seed(pool);
    await seed(pool);
    const app = createApp(pool, {
      origin: "http://127.0.0.1:3000",
      rateLimit: false,
    });
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    function client() {
      return {
        cookie: "",
        csrf: "",
        async request(
          path,
          {
            method = "GET",
            body,
            csrf = true,
            origin = "http://127.0.0.1:3000",
          } = {},
        ) {
          const headers = { Origin: origin };
          if (this.cookie) headers.Cookie = this.cookie;
          if (csrf && this.csrf) headers["X-CSRF-Token"] = this.csrf;
          if (body !== undefined) headers["Content-Type"] = "application/json";
          const response = await fetch(`${baseUrl}/api${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
          });
          const cookie = response.headers.get("set-cookie");
          if (cookie) this.cookie = cookie.split(";")[0];
          const data = await response.json();
          if (data.csrfToken) this.csrf = data.csrfToken;
          return { status: response.status, data };
        },
      };
    }
    const admin = client(),
      author = client(),
      other = client(),
      anonymous = client();
    const register = async (client, name) => {
      const result = await client.request("/auth/register", {
        method: "POST",
        body: {
          name,
          email: `${name.toLowerCase()}@example.test`,
          password: "A-long-test-password-123",
        },
      });
      assert.equal(result.status, 201);
      return result.data.user;
    };
    const owner = await register(admin, "Owner"),
      contributor = await register(author, "Author"),
      reviewer = await register(other, "Reviewer");
    await pool.query("UPDATE users SET role='admin' WHERE id=$1", [owner.id]);
    const catalog = await anonymous.request("/catalog");
    assert.equal(catalog.status, 200);
    assert.equal(catalog.data.resources.length, 58);
    assert.equal(catalog.data.subjects.length, 10);
    assert.equal(
      catalog.data.resources[0].title,
      "CS50 – Introduction to Computer Science",
    );
    assert.equal((await anonymous.request("/admin")).status, 401);
    assert.equal((await author.request("/admin")).status, 403);
    assert.equal((await author.request("/reviews")).status, 403);
    assert.equal(
      (
        await admin.request("/admin/policy", {
          method: "PUT",
          csrf: false,
          body: {
            approvalAward: 7,
            postingThreshold: 7,
            reviewingThreshold: 14,
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin.request("/admin/policy", {
          method: "PUT",
          origin: "https://different-site.test",
          body: {
            approvalAward: 7,
            postingThreshold: 7,
            reviewingThreshold: 14,
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin.request("/admin/policy", {
          method: "PUT",
          body: {
            approvalAward: 7,
            postingThreshold: 7,
            reviewingThreshold: 14,
          },
        })
      ).status,
      200,
    );
    const submission = (index) => ({
      type: "video",
      subject: "cs",
      title: `Useful course ${index}`,
      provider: "Example University",
      url: `https://example.test/course/${index}`,
      description:
        "A carefully explained introduction with exercises for engineering students.",
      topics: ["Algorithms"],
      tags: ["Beginner"],
    });
    assert.equal(
      (
        await author.request("/resources", {
          method: "POST",
          body: { ...submission("invalid"), url: "javascript:alert(1)" },
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await author.request("/resources", {
          method: "POST",
          body: { ...submission("invalid2"), subject: "unknown" },
        })
      ).status,
      400,
    );
    const pending = await author.request("/resources", {
      method: "POST",
      body: submission(1),
    });
    assert.equal(pending.status, 201);
    assert.equal(pending.data.resource.published, false);
    assert.equal(
      (
        await author.request("/resources", {
          method: "POST",
          body: submission(1),
        })
      ).status,
      409,
    );
    assert.ok(
      !(await anonymous.request("/catalog")).data.resources.some(
        (item) => item.id === pending.data.resource.id,
      ),
    );
    const id = pending.data.resource.id;
    const results = await Promise.all([
      admin.request(`/reviews/${id}`, {
        method: "POST",
        body: {
          decision: "approved",
          reason: "The link and course description are accurate.",
        },
      }),
      admin.request(`/reviews/${id}`, {
        method: "POST",
        body: {
          decision: "approved",
          reason: "Checked independently a second time.",
        },
      }),
    ]);
    assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
    const after = (await author.request("/me")).data.user;
    assert.equal(after.credits, 7);
    assert.equal(after.canPostDirectly, true);
    assert.equal(after.canReview, false);
    assert.equal(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM credit_ledger WHERE resource_id=$1 AND kind='approval'",
          [id],
        )
      ).rows[0].n,
      1,
    );
    const direct = await author.request("/resources", {
      method: "POST",
      body: submission(2),
    });
    assert.equal(direct.data.resource.published, true);
    assert.equal(direct.data.resource.status, "pending");
    assert.equal((await author.request("/me")).data.user.credits, 7);
    assert.equal(
      (
        await admin.request(`/admin/users/${contributor.id}/credits`, {
          method: "POST",
          body: {
            delta: 7,
            reason: "Recognized an additional useful contribution.",
          },
        })
      ).status,
      200,
    );
    assert.equal((await author.request("/me")).data.user.canReview, true);
    assert.equal(
      (
        await author.request(`/reviews/${direct.data.resource.id}`, {
          method: "POST",
          body: { decision: "approved", reason: "This is my own resource." },
        })
      ).status,
      403,
    );
    assert.ok(
      !(await author.request("/reviews")).data.resources.some(
        (item) => item.id === direct.data.resource.id,
      ),
    );
    const bad = await other.request("/resources", {
      method: "POST",
      body: submission(3),
    });
    assert.equal(
      (
        await author.request(`/reviews/${bad.data.resource.id}`, {
          method: "POST",
          body: {
            decision: "rejected",
            reason: "The resource does not cover the advertised topics.",
          },
        })
      ).status,
      200,
    );
    assert.equal((await other.request("/me")).data.user.credits, 0);
    assert.ok(
      !(await anonymous.request("/catalog")).data.resources.some(
        (item) => item.id === bad.data.resource.id,
      ),
    );
    assert.equal(
      (
        await admin.request("/admin/policy", {
          method: "PUT",
          body: {
            approvalAward: 3,
            postingThreshold: 50,
            reviewingThreshold: 50,
          },
        })
      ).status,
      200,
    );
    assert.equal((await author.request("/me")).data.user.canReview, false);
    assert.equal(
      (await author.request("/me")).data.user.canPostDirectly,
      false,
    );
    assert.equal(
      (
        await author.request(`/reviews/${direct.data.resource.id}`, {
          method: "POST",
          body: {
            decision: "approved",
            reason: "Trying after permission was revoked.",
          },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await admin.request(`/reviews/${direct.data.resource.id}`, {
          method: "POST",
          body: {
            decision: "approved",
            reason: "The trusted resource has been checked.",
          },
        })
      ).status,
      200,
    );
    assert.equal((await author.request("/me")).data.user.credits, 17);
    assert.equal(
      (
        await admin.request(`/admin/resources/${id}/withdraw`, {
          method: "POST",
          body: { reason: "This link no longer contains a useful resource." },
        })
      ).status,
      200,
    );
    assert.equal((await author.request("/me")).data.user.credits, 10);
    assert.ok(
      !(await anonymous.request("/catalog")).data.resources.some(
        (item) => item.id === id,
      ),
    );
    assert.equal(
      (
        await admin.request(`/admin/resources/${id}/withdraw`, {
          method: "POST",
          body: { reason: "Attempt to remove it again." },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await admin.request(`/admin/users/${contributor.id}/credits`, {
          method: "POST",
          body: { delta: -100, reason: "Invalid deduction test." },
        })
      ).status,
      400,
    );
    assert.ok((await author.request("/account")).data.ledger.length >= 3);
    assert.equal(
      (await author.request("/auth/logout", { method: "POST" })).status,
      200,
    );
    assert.equal((await author.request("/me")).data.user, null);
    assert.equal(
      (
        await author.request("/auth/login", {
          method: "POST",
          body: {
            email: "author@example.test",
            password: "Wrong-password-123",
          },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await author.request("/auth/login", {
          method: "POST",
          body: {
            email: "author@example.test",
            password: "A-long-test-password-123",
          },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await author.request("/auth/register", {
          method: "POST",
          body: {
            name: "Duplicate",
            email: "AUTHOR@example.test",
            password: "A-long-test-password-123",
          },
        })
      ).status,
      409,
    );
    assert.equal(
      canonicalUrl("https://youtu.be/abc123?si=tracking"),
      canonicalUrl("https://www.youtube.com/watch?v=abc123&utm_source=test"),
    );
    for (const path of [
      "/server/app.js",
      "/.env",
      "/db/seed/catalog.json",
      "/package.json",
    ])
      assert.equal((await fetch(`${baseUrl}${path}`)).status, 404);
    const front = await fetch(`${baseUrl}/`);
    assert.equal(front.status, 200);
    assert.ok(
      front.headers
        .get("content-security-policy")
        .includes("script-src 'self'"),
    );
    assert.ok((await admin.request("/admin")).data.audit.length > 5);
  },
);
