# EngineersVault

A JavaScript and PostgreSQL engineering library with accounts, resource submissions, a review queue, and configurable contribution credits.

## Start locally

Requires Node.js 22.13 or newer. From this directory:

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:3000**. The development command starts Express and a real local PostgreSQL cluster, applies migrations, and imports the starting catalog. Data persists in `.local/postgres`; restarting does not reset accounts or resources. Local credentials and database files are ignored by Git. No Docker or Windows service is needed. PostgreSQL listens on loopback port 55432.

The import contains 58 unique resources across 10 disciplines. The original Structural Analysis and Geotechnical Engineering entries shared a URL, so one duplicate is skipped. Re-running the seed does not overwrite moderation decisions or restore removed resources.

## Become the admin

1. Create your account through **Contribute / Create account**.
2. With the development server running, open another terminal in this directory:

```sh
npm run admin:grant -- your-email@example.com
```

3. Refresh the community page and open **Admin settings**.

Only someone with database access can grant the initial admin role. Registration creates normal members. No default admin account/password is shipped.

## Community workflow

- Everyone can browse. Members submit links with a description, discipline, educator/author, and optional topics/notes.
- New contributors enter the review queue. Eligible reviewers approve or reject other people's resources with an explanation.
- Approval publishes the resource and awards credits in one database transaction. Repeated or concurrent review requests cannot award credits twice.
- Users meeting the posting threshold can publish immediately. Their resource remains in the review queue for independent credit verification. Direct publishing alone earns no credits.
- Users meeting the reviewing threshold automatically gain reviewing permission. Lowering credits or raising thresholds removes those rights immediately on subsequent requests.
- Admins can change credit rules, adjust user credits with a reason, inspect permissions/activity, and remove published resources. Removal reverses the original award up to the author's current balance. History remains recorded.
- Self-review and duplicate canonical URLs are blocked. Reviewing itself earns no credits.

Initial editable rules: **10 credits per approval**, **100 for direct posting**, **250 for reviewing**. Set your own values in Admin settings. A threshold of zero grants that permission to every member. Award changes affect future approvals; existing ledger entries do not change.

Bookmarks remain device-local and separate from the shared resource review queue.

## Use another PostgreSQL database

Copy `.env.example` to `.env`, uncomment `DATABASE_URL`, and set it to an existing database. Then:

```sh
npm run db:migrate
npm run db:seed
npm start
```

`npm run dev` also respects `DATABASE_URL` and skips the local cluster when it is set. `APP_ORIGIN` must match the exact browser origin including scheme/port. Production uses secure cookies and requires HTTPS. `HOST` defaults to loopback. Set `TRUST_PROXY=1` only behind a trusted proxy. PostgreSQL TLS options in the connection URL are supported; certificate verification is not disabled.

## Structure

```text
public/             Library, community UI, API client, styles
server/             Express API, validation, authentication, DB access
db/migrations/      Versioned SQL schema
db/seed/catalog.json Starting catalog imported into PostgreSQL
scripts/            Local startup, migrations, seed, admin bootstrap
tests/              Integration checks against isolated PostgreSQL
docs/PROJECT_PLAN.md Architecture and future phases
```

The frontend fetches `/api/catalog` rather than loading hard-coded catalog arrays. Only `public/` is served. Seed JSON is an initial import, not the runtime data source.

## Verify

```sh
npm test
```

The test starts isolated PostgreSQL and checks accounts/sessions, authorization, CSRF/origin protection, validation, URL duplicates, simultaneous reviews, awards/reversals, changing policies, and private-file isolation. It removes only its own temporary database directory.

Authentication uses salted scrypt password hashes and random session tokens, stored as hashes in PostgreSQL. HTTP-only cookies, CSRF protection, parameterized queries, and input validation are implemented. Authentication/write rate limits are currently per application process.

Email verification, password recovery, reports/appeals, and background link checks are future phases in the project plan.
