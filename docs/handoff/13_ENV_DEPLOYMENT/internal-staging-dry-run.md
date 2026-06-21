# Useravaa V51 Internal Staging Deployment Dry Run

Last reviewed: 2026-06-21

This is a dry-run plan only. It does not approve deployment, Vercel connection, DNS/domain changes, production auth, provider setup, database creation, migrations, payment, email, SMS, storage, analytics, or monitoring.

## Recommendation

Recommended first path: Vercel Preview or a protected Vercel deployment, plus a separate managed PostgreSQL staging database, no custom domain, no public indexing, and internal team-only access.

Why this path:

- Vercel Preview is the lowest-ops fit for this Next.js App Router app.
- Preview URLs avoid production DNS/domain work.
- Vercel supports protected deployments using Vercel Authentication, Password Protection, or Trusted IPs.
- Managed PostgreSQL keeps staging separate from local and production databases.
- Payment, email, SMS, storage, analytics, monitoring, and production auth can remain mock/manual until a later checkpoint approves them.

Do not start with:

- VPS/manual server: too much SSL, process, firewall, logging, rollback, and secret-management work for first internal staging.
- Production domain: adds DNS, HSTS, indexing, SEO, legal, and rollback risk too early.
- Production database: risks real user/payment/support data exposure.
- Real payment/email/storage providers: introduces legal, privacy, billing, webhook, and support obligations before internal staging has proven the app basics.

## Protected Access Setup

Platform protection and app-level operator identity are separate:

- Platform protection can block outsiders from reaching the staging URL.
- App-level `ADMIN` and `SUPPORT` access needs a trusted identity signal that the app can read on the server.

The current code supports a secret-backed staging identity header source. It is safe only if an upstream layer controls the headers:

1. The hosting/proxy layer must strip any incoming client copies of the configured staging access headers.
2. The hosting/proxy layer must authenticate or otherwise protect the operator before it can inject trusted headers.
3. It must inject one header carrying the shared staging secret.
4. It must inject one header carrying the trusted operator identifier.
5. Raw browser-supplied headers must never be trusted.
6. `USERAVAA_STAGING_ACCESS_SECRET`, `STAGING_PRIMARY_ADMIN_EMAIL`, and `STAGING_SUPPORT_EMAIL` must live only in the hosting env store or secret manager.
7. Set `USERAVAA_ENABLE_STAGING_ACCESS=1` only in staging after the upstream header source is reviewed.
8. Keep `APP_ENV=staging` only for staging.
9. Keep `NODE_ENV` out of `production` if using the current staging access bridge, because the bridge intentionally refuses production runtime.
10. Production must use a real auth provider later, not this staging bridge.

Vercel limitation note:

- Vercel Deployment Protection can block access to preview or deployment URLs.
- Vercel protection alone does not give this app a committed `ADMIN` versus `SUPPORT` identity header.
- If the selected Vercel setup cannot strip client staging headers and inject trusted identity headers, app-level role-based staging access needs a separate trusted proxy/access layer or a real auth provider before private/admin staging can work.

## Staging Env Dry Run

| Env var | Internal staging status | Secret? | Expected dry-run posture |
|---|---|---:|---|
| `APP_ENV` | Required before deploy | No | `staging` |
| `APP_BASE_URL` | Required before deploy | No | Staging preview URL only |
| `API_BASE_URL` | Required before deploy | No | Staging API base URL only |
| `DATABASE_URL` | Required before deploy unless `PRISMA_ACCELERATE_URL` is selected | Yes | Managed staging PostgreSQL only |
| `PRISMA_ACCELERATE_URL` | Optional alternative | Yes | Staging-only if used |
| `AUTH_SECRET` | Required only after real session/auth provider is selected | Yes | Later only |
| `JWT_SECRET` | Required only if JWT sessions are selected | Yes | Later only |
| `USERAVAA_SITE_INDEXING` | Required before deploy | No | Must remain `0` |
| `USERAVAA_ENABLE_HSTS` | Required before deploy | No | Must remain `0` |
| `USERAVAA_ENABLE_DEV_AUTH` | Required before deploy | No | Must remain `0` |
| `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK` | Required before deploy | No | Must remain `0` |
| `USERAVAA_ENABLE_STAGING_ACCESS` | Required only if using app-level staging access | No | `0` until trusted headers are configured; then staging-only `1` |
| `STAGING_PRIMARY_ADMIN_EMAIL` | Required only if using app-level staging access | Yes | Deployment env store only |
| `STAGING_SUPPORT_EMAIL` | Required only if using app-level staging access | Yes | Deployment env store only |
| `USERAVAA_STAGING_ACCESS_HEADER` | Required only if using app-level staging access | No, sensitive by association | Deployment env store only |
| `USERAVAA_STAGING_ACCESS_IDENTITY_HEADER` | Required only if using app-level staging access | No, sensitive by association | Deployment env store only |
| `USERAVAA_STAGING_ACCESS_SECRET` | Required only if using app-level staging access | Yes | Deployment secret only |
| `USERAVAA_DB_SMOKE_TEST` | Required before deploy | No | Must remain `0` unless an operator approves safe smoke writes |
| `PAYMENT_PROVIDER` | Later only | No | Empty/disabled |
| `PAYMENT_CALLBACK_URL` | Later only | No | Empty |
| `PAYMENT_WEBHOOK_SECRET` | Later only | Yes | Empty |
| `NOTIFICATION_PROVIDER` | Later only | No | Empty/disabled |
| `EMAIL_PROVIDER` | Later only | No | Empty/disabled |
| `SMS_PROVIDER` | Later only | No | Empty/disabled |
| `UPLOAD_STORAGE_PROVIDER` | Later only | No | Empty/disabled |
| `UPLOAD_BUCKET` | Later only | No, sensitive by association | Empty |
| `SENTRY_DSN` | Later only | No, sensitive by association | Empty |
| `LOG_LEVEL` | Required before deploy | No | `info`, `warn`, or `error` |

## Database And Migration Dry Run

- Staging needs a separate managed PostgreSQL database.
- Never use a local database URL for staging.
- Never use a production database URL for staging.
- Run `npx.cmd prisma validate`.
- Run `npx.cmd prisma generate`.
- Run `npx.cmd prisma migrate status` before any migration apply.
- Run `npx.cmd prisma migrate deploy` only in a later approved deployment checkpoint, only against the confirmed staging database, and only after reviewing pending migrations.
- Do not run `prisma migrate reset`.
- Do not run `prisma db push`.
- Do not run destructive SQL.
- Enable backup/snapshot before migration apply if staging already has useful data.
- Seed only fake or explicitly consented data.

## Pre-Deploy Dry Run Checklist

- Git status is clean except known public logo/avatar leftovers.
- Correct branch and commit are recorded.
- `npm.cmd run lint` passes.
- `npm.cmd run typecheck` passes.
- `npm.cmd run test -- --pool=threads --maxWorkers=1` passes.
- `npm.cmd run build` passes.
- `npx.cmd prisma validate` passes.
- `npx.cmd prisma generate` passes.
- `npx.cmd prisma migrate status` passes against the intended staging database.
- Staging env vars are prepared in the hosting env store.
- Staging database is separate, managed, and not production.
- `USERAVAA_SITE_INDEXING=0`.
- `USERAVAA_ENABLE_HSTS=0`.
- `USERAVAA_ENABLE_DEV_AUTH=0`.
- `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0`.
- Payment, email, SMS, storage, analytics, and external monitoring remain disabled/manual.
- Staging access method is selected and reviewed.
- `ADMIN` and `SUPPORT` operator identifiers are prepared outside code.
- Rollback plan is prepared.
- Post-deploy smoke checklist is ready.

## Post-Deploy Smoke Checklist

- Staging URL loads.
- `/robots.txt` disallows `/` and noindex posture is active.
- `/dev` routes are blocked.
- Public `/discover` renders.
- Public `/insights` renders.
- Private pages require auth.
- `/admin` is blocked for anonymous users.
- `ADMIN` can access the admin shell if the trusted identity source is configured.
- `SUPPORT` can access support, lead, and review surfaces if the trusted identity source is configured.
- `SUPPORT` cannot perform `ADMIN`-only actions.
- Request/conversation flow works with fake/test data.
- Manual payment review uses fake references only.
- No real emails or SMS are sent.
- No real uploads are required.
- Admin audit events are created without sensitive payloads.
- Ops analytics shows staging data only.
- Logs contain no secrets or PII.
- Database writes occur only in the staging database.

## What Can Stay Mock Or Manual

- Online payment provider.
- Manual payment review with fake references.
- Payout and settlement operations.
- Email, SMS, Telegram, WhatsApp, and other delivery outside the app.
- Real receipt or avatar uploads.
- External analytics.
- External monitoring.
- Domain and DNS.
- Public SEO/indexing.

## Founder Actions Outside Codex

Now:

- Choose the staging host/account owner.
- Choose the separate managed PostgreSQL staging provider.
- Decide whether the first staging pass needs app-level `ADMIN`/`SUPPORT` access or only public-page review.
- Confirm whether a trusted proxy/access layer can strip and inject the staging identity headers.
- Choose the two real operator identifiers outside source control.

Later:

- Add real env values to the hosting env store or secret manager.
- Approve migration apply only after `migrate status` review.
- Approve fake seed data execution.
- Run smoke tests on the protected staging URL.

Not yet:

- Do not deploy.
- Do not connect Vercel, DNS, or a domain.
- Do not create production auth, payment, email, SMS, storage, analytics, or monitoring integrations.
- Do not import production data.
- Do not enable indexing or HSTS.

## Recommended Next Checkpoint

Checkpoint 3B-9 should be: Staging Host And Environment Readiness Review.

It should verify, still without deploying, that:

- The founder has chosen the host and database provider.
- The hosting project can keep a protected preview URL internal-only.
- The selected platform/proxy can supply the trusted app-level identity signal, or the team chooses a real auth provider instead.
- Staging env values exist only in the hosting env store or secret manager.
- `prisma migrate status` has been reviewed against the staging database.
- The first actual deploy checklist is ready for explicit approval.
