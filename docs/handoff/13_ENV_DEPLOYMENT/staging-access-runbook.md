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

## 3B-6 Access Decision

Recommended path: keep production auth provider unimplemented for now, and prepare a staging-only access resolver that can later consume a trusted upstream operator identifier.

Rejected for this checkpoint:

- Public staging login without a real auth provider. This would need credentials or a public route and would be easy to misuse.
- Real auth provider before staging. This is still the production path, but it requires a founder/provider decision and external setup.
- No staging access preparation. This would leave the next deployment attempt guessing about ADMIN/SUPPORT mapping.

Implemented preparation:

- `src/lib/auth/staging-access.ts` can resolve a trusted operator identifier to `ADMIN` or `SUPPORT`.
- It is disabled unless `USERAVAA_ENABLE_STAGING_ACCESS=1`.
- It only enables when `APP_ENV=staging`.
- It uses `APP_ENV`, not `NODE_ENV` alone, as the staging boundary because deployed Vercel previews may run with `NODE_ENV=production`.
- It requires `STAGING_PRIMARY_ADMIN_EMAIL` and `STAGING_SUPPORT_EMAIL` to be present and distinct.
- It is not wired into `getCurrentSession` and does not read browser-controlled headers or cookies.
- It does not create users, write database rows, create credentials, or add public routes.

The future wiring point must supply the operator identifier from a trusted upstream identity source, such as a selected auth provider, platform-protected identity layer, or operator-only server context. Do not read the identifier directly from client-submitted form data, query strings, cookies, or request headers unless an upstream system strips and signs them.

## 3B-7 Trusted Identity Source

Recommended path: use a secret-backed staging header resolver for internal staging only.

Identity-source options evaluated:

| Option | Security level | Complexity | Spoofing risk | Staging fit | Production fit | External setup | ADMIN vs SUPPORT? |
|---|---|---:|---|---|---|---:|---|
| Hosting preview protection only | Medium for site entry | Low | Low for entry, none for role identity | Good for restricting URL access | Not enough for app auth | Yes | No |
| Trusted reverse-proxy/header identity with shared secret | Medium-high if the proxy strips client headers and injects both values | Low-medium | Low when secret-backed | Good for internal staging | No, staging-only bridge | Yes | Yes |
| Signed staging cookie/token | Medium-high if short-lived and secret-backed | Medium | Low if no public mint route exists | Good if an internal issuer exists | No, staging-only bridge | Maybe | Yes |
| Basic auth at edge/platform | Medium | Low | Low for entry, none for app role identity | Good for site entry | Not app auth | Yes | No |
| Real auth provider now | High | Medium-high | Low when configured correctly | Strong | Strong | Yes | Yes |
| Keep decision-only and defer wiring | High safety, no access | Low | None | Blocks private/admin staging | Not a solution | No | No |

Implemented 3B-7 behavior:

- `getCurrentSession` still checks the production auth adapter first.
- If no provider viewer exists, it checks a staging-only, secret-backed header resolver.
- The staging resolver is disabled unless all of these are true:
  - `USERAVAA_ENABLE_STAGING_ACCESS=1`
  - `APP_ENV=staging`
  - `STAGING_PRIMARY_ADMIN_EMAIL` and `STAGING_SUPPORT_EMAIL` are present and distinct
  - `USERAVAA_STAGING_ACCESS_HEADER` is present and names the header carrying the shared secret
  - `USERAVAA_STAGING_ACCESS_IDENTITY_HEADER` is present and names the trusted operator identifier header
  - `USERAVAA_STAGING_ACCESS_SECRET` is present
- The secret value is compared server-side and is not logged.
- A raw identity header without the matching secret resolves to no viewer.
- Unknown identifiers resolve to no viewer.
- The resolver maps only:
  - `STAGING_PRIMARY_ADMIN_EMAIL` -> `ADMIN`
  - `STAGING_SUPPORT_EMAIL` -> `SUPPORT`
- `NODE_ENV=production` is allowed for deployed staging only when `APP_ENV=staging` and every staging access gate above passes.
- Real production must set `APP_ENV=production` and keep `USERAVAA_ENABLE_STAGING_ACCESS=0`; `APP_ENV=production` disables this staging resolver.
- Local dev fixture auth remains a later fallback and remains disabled in production.
- No public login route, signup route, staging bootstrap route, password flow, user creation, database write, migration, or provider integration was added.

Operational requirement before enabling this in staging:

- Configure the hosting platform, reverse proxy, or protected internal edge layer to strip any incoming client copies of the configured staging access headers.
- Inject the secret header and trusted identity header only after the operator has passed platform-controlled access.
- Store real header names, real operator identifiers, and the secret only in the deployment env store or secret manager.
- Keep `USERAVAA_ENABLE_STAGING_ACCESS=0` until this upstream protection is configured and reviewed.

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
- `USERAVAA_ENABLE_STAGING_ACCESS=0` until the trusted header source is configured and reviewed
- `USERAVAA_STAGING_BOOTSTRAP_DRY_RUN=1`

Required placeholder env variable names:

- `STAGING_PRIMARY_ADMIN_EMAIL`
- `STAGING_SUPPORT_EMAIL`
- `USERAVAA_STAGING_ACCESS_HEADER`
- `USERAVAA_STAGING_ACCESS_IDENTITY_HEADER`
- `USERAVAA_STAGING_ACCESS_SECRET`

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
| `USERAVAA_ENABLE_STAGING_ACCESS` | Later | `0` | No | Set to `1` only after the trusted secret-backed header source is configured and tested. |
| `USERAVAA_STAGING_ACCESS_HEADER` | Later | Empty placeholder only | No, but sensitive by association | Header name for the shared secret value. Real value belongs in deployment env. |
| `USERAVAA_STAGING_ACCESS_IDENTITY_HEADER` | Later | Empty placeholder only | No, but sensitive by association | Header name for the trusted operator identifier. Real value belongs in deployment env. |
| `USERAVAA_STAGING_ACCESS_SECRET` | Later | Empty placeholder only | Yes | Shared secret for the staging header resolver. Real value belongs only in deployment env or secret manager. |
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
- Configure the protected platform/proxy layer that injects the staging identity and secret headers for internal operators only.
- Approve a one-time role bootstrap implementation or provider mapping.
- Run staging smoke tests with the checklist above.

Not yet:

- Do not connect DNS or production domain.
- Do not connect payment, payout, email, SMS, storage, analytics, or monitoring providers.
- Do not import production data.
- Do not create real passwords in source control.

## Recommended Next Checkpoint

Checkpoint 3B-8 should be: Internal Staging Deployment Dry Run And Protected Access Setup.

It should verify the protected staging URL and environment setup without connecting production domain, payment, email, SMS, storage, analytics, or monitoring providers:

- Confirm the hosting/proxy layer strips client-supplied staging headers before injecting trusted values.
- Add real staging-only operator identifiers and the staging access secret only to the deployment env store.
- Keep the first deployment internal-only and noindex.
- Run the smoke checklist with fake data only.
- Do not run `prisma migrate deploy` until the migration review checkpoint approves it.
