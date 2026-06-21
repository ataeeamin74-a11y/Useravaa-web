# Useravaa V51 Staging Access Runbook

Last reviewed: 2026-06-21

This runbook prepares internal staging access only. It does not deploy the app, connect a domain, create external accounts, implement a production auth provider, or create real credentials.

## Scope

The founder has selected two staging operator roles:

- `STAGING_PRIMARY_ADMIN_EMAIL` maps to one `ADMIN` operator with full admin/operator access.
- `STAGING_SUPPORT_EMAIL` maps to one `SUPPORT` operator for support, lead, and review operations.

These are placeholder env variable names. Do not put real operator emails, usernames, passwords, phone numbers, OTPs, or tokens in source control.

## Current Readiness

- Prisma has `UserRole` values for `USER`, `ADMIN`, and `SUPPORT`.
- `User.email` is unique and can later link an auth-provider identity to a database user row.
- Admin pages and admin API routes are server guarded.
- Dev fixture auth is disabled in production mode and must stay disabled in deployed staging.
- No public admin bootstrap route exists and none should be added for staging.
- No unauthenticated role assignment API exists and none should be added for staging.
- The auth adapter is still provider-neutral. It does not create sessions from a real provider yet.

## Important Gap

Database rows alone will not make staging login work because the production auth provider has not been selected or wired. After the provider decision, the provider identity must map to the `User` row and role on the trusted server side.

Do not add a public route that accepts `role`, `isAdmin`, `adminUserId`, `actorAdminUserId`, or similar fields from the browser to create or promote an account.

## Bootstrap Model

1. Select and configure the staging auth/access mechanism in a later checkpoint.
2. Create the two operator identities inside the selected auth provider or protected identity system.
3. Store the real operator identifiers only in deployment environment variables or the provider dashboard.
4. Link those identities to database users with server-side code or an operator-only script.
5. Assign roles only on the server side:
   - `STAGING_PRIMARY_ADMIN_EMAIL` -> `ADMIN`
   - `STAGING_SUPPORT_EMAIL` -> `SUPPORT`
6. Verify login and admin access manually in staging.
7. Remove or disable any one-time bootstrap write path after use.

## Preflight Helper

Run this locally or in a controlled staging shell before an actual staging deployment attempt:

```powershell
npm.cmd run staging:bootstrap:preflight
```

The helper checks only variable presence and safe flag posture. It does not connect to a database, create users, assign roles, print secrets, or write files.

Expected safe staging flags:

- `APP_ENV=staging`
- `USERAVAA_SITE_INDEXING=0`
- `USERAVAA_ENABLE_HSTS=0`
- `USERAVAA_ENABLE_DEV_AUTH=0`
- `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0`
- `USERAVAA_STAGING_BOOTSTRAP_DRY_RUN=1`

Required placeholder env variable names:

- `STAGING_PRIMARY_ADMIN_EMAIL`
- `STAGING_SUPPORT_EMAIL`

If a future checkpoint enables a database-writing bootstrap, it must be idempotent, operator-only, disabled by default, refused in production unless explicitly approved, and audited.

## Role And Permission Safety

Current staging access intent:

- `ADMIN`: full operator access, including pricing, taxonomy, content, and sensitive lifecycle actions already marked ADMIN-only.
- `SUPPORT`: support, lead, payment-review, profile-review, insight-review, and operational read surfaces where existing server-side services allow it.

Current safety boundaries:

- Route-level admin access allows `ADMIN` and `SUPPORT`.
- Service-level checks keep SUPPORT out of ADMIN-only content, category, pricing, and sensitive lead/support lifecycle actions.
- Actor identity is derived from the authenticated server session, not from client payloads.
- Strict validation schemas reject unsafe extra fields such as client-supplied role or actor overrides.

Before wider staging access, verify SUPPORT cannot:

- Create, update, archive, or restore platform content entries.
- Create, update, or deactivate pricing rules.
- Create, update, archive, or restore taxonomy categories.
- Convert, mark lost, reopen, archive, or bulk-import leads unless already ADMIN-only in the service layer.
- Resolve, reopen, or archive support tickets if those actions remain ADMIN-only.

## Seed Data Plan

Use only fake or explicitly consented data.

Allowed for internal staging:

- MVP job categories/topics from the existing taxonomy seed.
- Platform content entries from the existing platform content seed.
- Small fake support tickets for support workflow review.
- Small fake leads that are clearly marked as test records.
- Sample content states such as draft, hidden, and published only if they use fake copy.
- Sample conversations only if they use fake users and no real payment proof.

Not allowed:

- Real user data.
- Real lead imports without consent.
- Real payment references.
- Real receipt files.
- Real payout or settlement data.
- Production database exports.
- Uploaded CSVs retained as staging artifacts.

Seed execution should be explicit:

```powershell
npm.cmd run taxonomy:seed
node tools/content/seed-platform-content.mjs
```

Run seeds only against the managed staging PostgreSQL database after confirming the target `DATABASE_URL` is not production. The commands above can write rows, so they are not part of this planning checkpoint.

## Staging Migration Runbook

1. Confirm `APP_ENV=staging`.
2. Confirm `DATABASE_URL` points to the separate managed staging PostgreSQL database.
3. Confirm backups or snapshots are enabled when staging already has useful data.
4. Run:

```powershell
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate status
```

5. Review pending migrations before applying them.
6. Run `npx.cmd prisma migrate deploy` only during the actual staging deployment checkpoint and only after review.
7. Run app smoke tests after deployment.
8. Record migration date, operator, commit hash, and database target label.

Never run these against staging or production:

- `prisma migrate reset`
- `prisma db push`
- destructive SQL
- local dev `DATABASE_URL`
- production `DATABASE_URL`

Rollback concept:

- Prefer application rollback to the previous deployable commit when code fails.
- For data issues, restore from a staging snapshot into a non-production database first.
- Do not manually reverse migrations without engineering review.

## Post-Deploy Smoke Checklist

- App loads on the staging URL.
- `/robots.txt` blocks indexing and noindex posture is active.
- `/admin` is blocked for no user.
- `/admin` is blocked for normal `USER`.
- `ADMIN` can access the admin shell.
- `SUPPORT` can access allowed support, lead, and review surfaces.
- `SUPPORT` cannot perform ADMIN-only pricing, taxonomy, content, lead lifecycle, or system-sensitive mutations.
- `/dev` routes are blocked in production-like mode.
- `/discover` renders.
- `/insights` renders.
- Public profile pages render only public-safe information.
- Private pages require auth.
- Manual payment review uses fake references only.
- No real payment provider is called.
- No email or SMS is sent.
- No real uploads are required.
- Basic staging database read/write checks use fake data only.
- Admin audit events record admin actions without leaking raw payloads or secrets.
- Ops analytics shows staging data only.

## Environment Inventory For Staging Access

| Env var | Required before staging access test? | Safe source-control value | Secret? | Notes |
|---|---:|---|---:|---|
| `STAGING_PRIMARY_ADMIN_EMAIL` | Yes | Empty placeholder only | Yes in real env | Real value belongs only in deployment env or secret manager. |
| `STAGING_SUPPORT_EMAIL` | Yes | Empty placeholder only | Yes in real env | Real value belongs only in deployment env or secret manager. |
| `USERAVAA_STAGING_BOOTSTRAP_DRY_RUN` | Yes | `1` | No | Keep dry-run until a later checkpoint approves writes. |
| `USERAVAA_ALLOW_STAGING_BOOTSTRAP` | Yes | `0` | No | Keep disabled until a one-time bootstrap write is approved. |
| `APP_ENV` | Yes | `staging` | No | Required for staging posture. |
| `USERAVAA_SITE_INDEXING` | Yes | `0` | No | Staging must remain noindex. |
| `USERAVAA_ENABLE_HSTS` | Yes | `0` | No | Keep off until production domain/HTTPS approval. |
| `USERAVAA_ENABLE_DEV_AUTH` | Yes | `0` | No | Dev fixture auth must stay off in deployed staging. |
| `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK` | Yes | `0` | No | Demo fallback must stay off in deployed staging. |

## Founder Actions

Now:

- Confirm the hosting platform and staging database provider.
- Decide the staging access mechanism or auth provider.
- Decide who owns the two real operator identities outside source control.

Later:

- Create the two operator accounts in the selected auth provider.
- Add real operator identifiers to the hosting platform env store.
- Approve a one-time role bootstrap implementation or provider mapping.
- Run staging smoke tests with the checklist above.

Not yet:

- Do not connect DNS or production domain.
- Do not connect payment, payout, email, SMS, storage, analytics, or monitoring providers.
- Do not import production data.
- Do not create real passwords in source control.

## Recommended Next Checkpoint

Checkpoint 3B-6 should be: Staging Auth Access Implementation Decision.

It should choose one path:

- Wire the selected real auth provider for staging and production.
- Or build a tightly restricted staging-only access mechanism that cannot be enabled in production and cannot self-promote roles.

That checkpoint must include admin/support role mapping, no client-controlled role assignment, deployment-env-only operator identifiers, and tests proving SUPPORT remains limited.
