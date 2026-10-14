# EngineersVault project plan

## Direction

Build a community-maintained engineering library. Shared publishing, review decisions, accounts, credits, and permissions require a backend and database so everyone sees consistent results and rules are enforceable outside the browser.

The confirmed first version uses JavaScript (Node.js/Express), PostgreSQL, email/password accounts, a resource review queue, and owner-configurable credit rules.

## Architecture

```text
Browser: library / community / admin
                  |
           same-origin JSON API
                  |
      validation + sessions + permission checks
                  |
               PostgreSQL
   users | resources | reviews | credit ledger
   policy | disciplines | sessions | audit history
```

Use one application and database initially. The human review queue is a query over pending resources. A separate message broker is unnecessary at this stage; introduce job infrastructure when background link checking or email delivery needs it.

## Implemented phases

1. Persistent resource catalog, versioned migrations, idempotent seed import, stable IDs, canonical URL deduplication, and a catalog API.
2. Email/password signup/login/logout, salted password hashes, database sessions, HTTP-only cookies, and CSRF/origin validation. Members cannot select an admin role at registration.
3. Resource submission form, server validation, pending queue, independent approval/rejection, and account submission status/review explanations.
4. Credits awarded only after independent approval, permanent credit history, editable posting/reviewing thresholds, automatic permission checks, and audited admin adjustments.
5. Trusted posts are public while awaiting verification. Rejection hides them. Admin removal hides a published resource and reverses its approval award up to the contributor's current balance.
6. Local PostgreSQL startup, external database configuration, database-owner admin bootstrap, setup documentation, and PostgreSQL integration verification.

## Credit rules

The owner controls the approval award and each permission threshold in Admin settings. Starter values are editable defaults. Rights follow the current balance and rules automatically; policy changes do not rewrite previous credit history.

Direct posting and earning credits are distinct: trusted contributors can publish immediately, but another eligible reviewer must approve the resource before contribution credits are awarded. Reviewing itself earns no credits in this version. Self-review is prohibited.

Review status, visibility, ledger insertion, and balance updates occur together. Resource/user locks and a unique approval-credit constraint prevent duplicate rewards under concurrent requests. References: [PostgreSQL row locking](https://www.postgresql.org/docs/current/explicit-locking.html), [node-postgres transactions](https://node-postgres.com/features/transactions).

## UI plan

Reuse the library palette: page `#edf3f9`, white `#ffffff`, navy `#182d49`, muted text `#596b80`, action blue `#245bd7`, dividers `#d8e2ee`. Source Serif 4 handles the page heading; IBM Plex Sans handles reading and controls.

Keep cards for resource discovery. Use left-aligned forms and compact decision rows for contribution work. Status text distinguishes publication from credit verification.

```text
Library:   Search -> discipline/type filters -> resources
Community: Account | Submit | Review queue | Admin settings
Account:   Credits and rights -> submissions -> credit history
Admin:     Rules -> credit adjustments -> members -> removal -> audit
```

## Future phases

1. Email verification and password recovery with an email provider and expiring tokens. The current app sends no email.
2. Reports, appeals, resource corrections/resubmissions, and reviewer conflict/collusion checks.
3. Server-side search/pagination, paginated member/history screens, query indexes based on traffic, and shared rate limits for multiple app instances.
4. Background broken-link checks, provider metadata enrichment, and moderation notifications using a job worker.
5. Account-synced bookmarks, personal learning queues, and progress, separate from the community review queue.
6. Managed PostgreSQL, HTTPS hosting, backups/restore verification, monitoring, and host-specific deployment configuration.

## Acceptance checks

- Catalog and accounts survive a restart.
- New contributor submissions remain private until approval.
- An independent approval awards credits once, including simultaneous review attempts.
- Crossing thresholds grants rights; credit/rule changes update permissions.
- Trusted publishing earns no automatic credits and remains reviewable.
- Self-review is blocked.
- Rejection hides resources, and removal preserves history while reversing awards.
- Desktop/mobile UI exposes only the controls the account can use.
