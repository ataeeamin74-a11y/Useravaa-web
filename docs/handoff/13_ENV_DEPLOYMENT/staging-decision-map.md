# Useravaa V51 Staging Decision Map

Last reviewed: 2026-06-21

This is a planning document only. It does not approve deployment, domain connection, production provider setup, migrations, or real external accounts.

## Current Baseline

- The app is a Next.js App Router project with dynamic private, admin, API, and public routes.
- Prisma is configured for PostgreSQL. Runtime database access requires `DATABASE_URL` or `PRISMA_ACCELERATE_URL`.
- Security headers are configured in `next.config.ts`.
- `robots.txt` defaults to noindex unless `APP_ENV=production` and `USERAVAA_SITE_INDEXING=1`.
- HSTS is disabled unless `APP_ENV=production` and `USERAVAA_ENABLE_HSTS=1`.
- CI runs lint, typecheck, tests, build, Prisma validate, and Prisma generate.
- Current auth, payment, notification, and upload adapters are provider-neutral and not production-wired.
- Dev fixture auth and admin demo fallback are blocked in `NODE_ENV=production` and should stay disabled in deployment environments.
- Known production gaps include auth provider, payment provider, notification delivery, object storage, monitoring, legal terms, refund rules, payout rules, and KYC/identity requirements.

## Overall Recommendation

Use an internal-only staging deployment, not public staging. The lowest-risk path for a non-technical founder is:

1. Vercel Preview or a protected Vercel deployment for the Next.js app.
2. A separate managed PostgreSQL staging database.
3. No production domain yet; use the platform preview URL.
4. No real payments, payouts, uploads, email, SMS, analytics, or external monitoring in the first staging pass.
5. A dedicated technical checkpoint before deployment to finalize staging access, admin bootstrap, seed data, and migration runbook.

Do not deploy until staging access is decided. With the current code, deployed production-mode environments will not use dev fixture auth, so private/admin staging needs either a real auth provider or a deliberately scoped staging access implementation.

## Hosting And Deployment Platform Options

| Option | Fit with Next.js App Router | Database/env handling | Operational complexity | Cost/complexity | Recommendation |
|---|---|---|---|---|---|
| Vercel | Best fit. Vercel documents zero-configuration Next.js deployment and framework-aware SSR support. | Strong preview/production env separation. Database can be external managed PostgreSQL. | Low. Git-based deploys and preview URLs are founder-friendly. | Low to medium depending plan and usage. | Recommended for internal staging, especially with deployment protection and no custom domain yet. |
| Render | Good fit as a Node web service for full Next.js apps. | Env vars are straightforward. Managed Postgres can be separate. | Medium. More service/runtime choices than Vercel. | Low to medium. | Good fallback if the team wants a general app hosting platform. |
| Railway | Good fit and has a documented Next.js plus Postgres path. | Strong app plus Postgres project model with `DATABASE_URL` references. | Medium. Convenient but more infrastructure-shaped than Vercel. | Medium, usage-based. | Good if bundled app and database operations are preferred. |
| Fly.io | Works, but generally container/image oriented. | Env/secrets are manageable, database is separate. | Medium to high. Requires more CLI/Docker comfort. | Medium. | Not first choice for a non-technical founder. Better later if region/control needs demand it. |
| VPS/manual Node hosting | Technically possible using `next build` and `next start`. | Fully manual env, SSL, process, firewall, backups, logs. | High. Requires system administration. | Can look cheap but has high hidden ops cost. | Not recommended for initial staging. |

Platform references checked: Vercel Next.js docs, Render Next.js docs, Railway Next.js with Postgres docs, Fly.io Next.js docs, and Next.js self-hosting docs.

## Staging Database Recommendation

Local database is not enough for deployed staging. It is fine for developer smoke tests, but staging needs a shared managed PostgreSQL database that is separate from production.

Recommended staging database shape:

- Provider type: managed PostgreSQL.
- Database name: clearly marked as staging.
- Credentials: staging-only, stored only in platform environment variables.
- Access: limited to operators who need it.
- Backups: enabled if provider supports it, even for staging.
- Data: fake or consented test data only.
- Migration approach: run `npx prisma migrate status` first, then `npx prisma migrate deploy` only after migration review.
- Seed approach: use non-sensitive seed data and avoid importing production users, support tickets, leads, payments, or receipts.

Provider options to evaluate: Neon, Supabase Postgres, Railway Postgres, Render Postgres, or the hosting platform marketplace database. The founder should verify billing, regional availability, legal/compliance fit, and operational access before selection.

Do not:

- Reuse a production database.
- Import production data.
- Run `prisma migrate reset` or destructive SQL.
- Run public smoke tests against production credentials.

Required database env vars:

- `DATABASE_URL` for direct PostgreSQL runtime, or `PRISMA_ACCELERATE_URL` if Prisma Accelerate is intentionally selected.
- `USERAVAA_DB_SMOKE_TEST=0` by default in shared staging and CI.

## Auth Provider Decision Map

| Option | Fit for Useravaa | Risk | Speed | Staging suitability | Production suitability | Founder decision required |
|---|---|---|---|---|---|---|
| Temporary internal staging with dev fixture auth | Useful for local demos only. Current code blocks fixture auth in production-mode deploys. | High if exposed on any public URL. | Fast locally, not safe for deployed staging. | Local only. Not recommended for deployed staging. | No. | Decide whether internal staging must include private/admin flows before real auth. |
| Real auth before staging | Cleanest for testing private/admin flows. | Medium because provider choice affects UX and user data. | Medium. | Strong if scoped to test users. | Strong. | Select provider and login methods. |
| Google login | Fast for internal testers with Google accounts. | Medium. May not fit all Iranian users or phone-first flows. | Fast. | Good for internal staging. | Optional for production, not enough alone if phone/email coverage is required. | Decide whether Google accounts are acceptable for first testers. |
| Email/password | Familiar and provider-flexible. | Medium. Requires password reset, security controls, and support process. | Medium. | Good if provider handles security. | Good baseline. | Decide account recovery and admin bootstrap process. |
| Mobile OTP | Strong fit for local marketplace behavior if reliable SMS provider exists. | Medium to high. Requires SMS provider, abuse controls, cost controls, phone privacy. | Slower. | Can wait unless phone-first testing is required. | Likely important for production if phone identity is central. | Choose SMS provider and phone verification policy. |
| Magic link/email OTP | Lower password support burden. | Medium. Depends on email deliverability. | Medium. | Good if email provider is ready. | Good for lighter MVP auth. | Decide whether email-only login is acceptable. |

Recommended staging path:

- Do not expose dev fixture auth on a deployed URL.
- For internal staging, either use protected platform preview access plus a minimal staging auth/admin bootstrap checkpoint, or wire the selected real auth provider before staging.
- Keep `USERAVAA_ENABLE_DEV_AUTH=0` and `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0` in deployment environments.

Recommended production path:

- Use a real auth provider with email/password or magic link first, plus optional Google login.
- Add mobile OTP only after SMS provider, cost controls, and phone privacy policy are selected.
- Define the first ADMIN and SUPPORT bootstrap method before public access.

## Payment Provider Decision Map

Current payment provider status:

- `paymentAdapter.createCheckout()` returns `adapter_not_configured`.
- Online payment should not be presented as production-ready.
- Manual payment review exists and can be tested with fake references and fake receipt metadata.
- Wallet and settlement entities exist, but payout/settlement policy and provider wiring are not production-ready.

| Option | Staging use | Production use | Risk | Founder decision |
|---|---|---|---|---|
| Keep manual payment review for internal staging | Good for testing admin review flow with fake data only. | Not enough for public paid launch without legal/finance approval. | Low for internal tests, high if real money is accepted casually. | Decide whether internal testers can use fake payment references only. |
| Delay real online payment | Recommended. | Must end before real paid launch. | Low now. | Decide when payment provider selection starts. |
| Add payment provider later | Good. Create a dedicated integration checkpoint after staging access and DB are stable. | Required before scalable paid production. | Medium to high. | Select licensed provider, callback/webhook rules, settlement rules. |
| Keep wallet/payout disabled | Recommended for staging. | Must be resolved before provider payouts. | Low now. | Decide payout policy, timing, KYC, tax, refund, cancellation. |

What can be tested in staging without real payment:

- Checkout page states.
- Manual payment submission using fake reference numbers.
- Admin approve/reject flow.
- Provider visibility after approved manual payment.
- Wallet credit logic only in safe non-production smoke tests.

What must not launch publicly:

- Real money collection without a selected provider and legal/finance approval.
- Real payouts or settlement requests.
- Claims that online payment, refunds, or payout automation are production-ready.

Production blockers:

- Payment provider selected and integrated.
- Webhook/callback verification.
- Refund, cancellation, wallet, payout, tax, and settlement policy.
- Reconciliation and admin reporting.

## Email And Notification Decision Map

Current state:

- In-app notification concepts and UI exist.
- `notificationAdapter.send()` returns `adapter_not_configured`.
- Email/SMS providers are not wired.

Staging recommendation:

- Keep delivery manual for internal staging.
- Use in-app notification screens for UI review only.
- Use Telegram, WhatsApp, phone, or email manually as an operations process, not as an implemented integration.

Production blockers:

- Transactional email provider selected and wired.
- SMS/OTP provider selected if phone login or SMS notifications are required.
- Delivery retry/failure handling.
- User notification preferences.
- PII-safe templates and logs.

Future env/provider needs:

- `NOTIFICATION_PROVIDER`
- `EMAIL_PROVIDER`
- `SMS_PROVIDER`
- Provider API keys, sender identities, webhook secrets, and suppression/bounce handling, once selected.

## Upload And Storage Decision Map

Current state:

- `uploadAdapter.prepareAvatarUpload()` returns `adapter_not_configured`.
- Profile image upload is in MVP scope.
- Manual payment receipt metadata exists, but real receipt file storage is not production-ready.
- CSV import is transient admin input and should not become durable object storage.

Staging recommendation:

- Avoid real uploads in internal staging where possible.
- If testing manual payment receipts, use fake metadata only and do not store sensitive real receipts.
- Do not use local-only file storage for any shared deployed staging.

Production blockers:

- Object storage provider selected.
- Private bucket/access policy for receipts and identity-sensitive files.
- Avatar validation, size/type limits, malware considerations, retention, deletion, and signed URL rules.
- Clear privacy rules for receipt/proof access.

Likely provider categories:

- S3-compatible object storage.
- Cloud provider object storage.
- Hosting marketplace object storage.

## Monitoring, Logging, And Error Reporting

Staging recommendation:

- Use platform build/runtime logs and `LOG_LEVEL=info` or `warn`.
- Do not add external monitoring in the first internal staging pass unless the founder approves provider setup.
- Keep logs PII-safe. Do not log raw env values, receipt details, payment references, auth tokens, session cookies, phone numbers, or full emails.

Production blockers:

- Error reporting provider selected, such as Sentry or equivalent.
- Alert routing for payment, auth, and admin failures.
- PII redaction rules.
- Incident owner and escalation path.

## Domain, DNS, And SSL

Recommendation:

- A real domain is not needed for the first internal staging pass.
- Use the hosting platform preview URL with deployment protection.
- A staging subdomain such as `staging.useravaa...` can wait until auth and access controls are ready.
- Connect the production domain only after legal, privacy, auth, payment, monitoring, and launch-readiness approval.
- SSL should be platform-managed.
- Keep `USERAVAA_ENABLE_HSTS=0` outside production. Enable HSTS only after HTTPS and domain ownership are verified.

Founder must prepare later:

- Domain/DNS account access.
- Decision on staging subdomain.
- Production domain ownership and DNS change window.
- Legal approval for public indexing and public launch.

## Staging Environment Variable Inventory

| Env var | Required for staging? | Safe placeholder/default | Secret? | Current status | Founder/action needed |
|---|---:|---|---:|---|---|
| `APP_ENV` | Yes | `staging` | No | In schema and examples. | Set to `staging` in staging platform. |
| `APP_BASE_URL` | Yes | Platform preview URL | No | In schema and examples. | Fill with final staging URL after platform selection. |
| `API_BASE_URL` | Yes | `${APP_BASE_URL}/api` | No | In schema and examples. | Fill after staging URL is known. |
| `DATABASE_URL` | Yes | Managed staging PostgreSQL URL | Yes | In schema and examples. | Provision staging DB and store secret in platform env. |
| `AUTH_SECRET` | Needed once staging auth exists | Generated secret | Yes | In schema and examples. | Generate only for selected auth/session implementation. |
| `JWT_SECRET` | Needed if JWT sessions are used | Generated secret | Yes | In schema and examples. | Decide with auth provider/session architecture. |
| `USERAVAA_SITE_INDEXING` | Yes | `0` | No | In schema and examples. | Keep `0` for staging. |
| `USERAVAA_ENABLE_HSTS` | Yes | `0` | No | In schema and examples. | Keep `0` for staging. |
| `USERAVAA_ENABLE_DEV_AUTH` | Yes | `0` | No | In schema and examples. | Keep `0` in deployed environments. |
| `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK` | Yes | `0` | No | In schema and examples. | Keep `0` in deployed environments. |
| `USERAVAA_DB_SMOKE_TEST` | Yes | `0` | No | In schema and examples. | Keep `0` in shared staging unless an operator explicitly runs safe DB smoke tests. |
| `PAYMENT_PROVIDER` | No for internal staging | Empty or `manual_disabled` | No | In schema and examples. | Defer until payment checkpoint. |
| `PAYMENT_CALLBACK_URL` | No for internal staging | Empty | No | In schema and examples. | Set only after real provider selection. |
| `PAYMENT_WEBHOOK_SECRET` | No for internal staging | Empty | Yes | In schema and examples. | Set only after real provider selection. |
| `NOTIFICATION_PROVIDER` | No for internal staging | Empty or `manual` | No | In schema and examples. | Defer until notification checkpoint. |
| `EMAIL_PROVIDER` | No for internal staging | Empty or `manual` | No | In schema and examples. | Defer until email checkpoint. |
| `SMS_PROVIDER` | No for internal staging | Empty or `manual` | No | In schema and examples. | Defer until SMS/OTP checkpoint. |
| `UPLOAD_STORAGE_PROVIDER` | No if uploads avoided | Empty or `disabled` | No | In schema and examples. | Defer until object storage checkpoint. |
| `UPLOAD_BUCKET` | No if uploads avoided | Empty | No, but sensitive by association | In schema and examples. | Set only after object storage selection. |
| `SENTRY_DSN` | No for first internal staging | Empty | No, but treat as config-sensitive | In schema and examples. | Defer until monitoring checkpoint. |
| `LOG_LEVEL` | Yes | `info` or `warn` | No | In schema and examples. | Use `info` for internal staging, `warn` for quieter review. |

## Internal Staging Safety Rules

- Internal testers only.
- No real user acquisition.
- No public marketing campaign.
- No real payment.
- No real payouts or settlement requests.
- No production data.
- No search indexing.
- Separate staging database.
- Test users only.
- Admin access limited to named operators.
- Support/lead data must be fake or explicitly consented.
- Payment references and receipts must be fake.
- Known gaps must remain visible in founder/admin checklist.
- Do not connect production domain.
- Do not enable HSTS or indexing outside production approval.
- Do not enable dev fixture auth on a public deployed URL.
- Do not import uploaded CSVs containing real leads without consent.

## Founder Decision Matrix

| Decision | Recommended for now | Needed before staging? | Needed before production? | Founder action | Risk if delayed |
|---|---|---:|---:|---|---|
| Hosting platform | Vercel Preview/protected deployment | Yes | Yes | Pick staging host and account owner. | No deploy target. |
| Staging database | Managed PostgreSQL, separate from production | Yes | Yes | Choose provider and approve cost/access. | Deployed app cannot test DB-backed flows. |
| Auth provider | Decide staging access first; production provider soon after | Yes for private/admin staging | Yes | Pick login method and provider direction. | Private/admin staging blocked or unsafe. |
| Admin bootstrap method | Named staging ADMIN/SUPPORT setup | Yes | Yes | Decide who gets admin/support and how created. | Admin tests impossible or uncontrolled. |
| Payment provider | Defer; manual fake review only | No | Yes | Select provider later with finance/legal. | Real paid launch blocked. |
| Email provider | Defer; manual comms | No | Usually yes | Decide provider and sender domain later. | Transactional delivery blocked. |
| SMS provider | Defer unless mobile OTP is chosen | No | If OTP/SMS required | Decide SMS/OTP provider later. | Phone login/SMS notifications blocked. |
| Upload/object storage | Defer; avoid real uploads | No for internal staging | Yes | Select storage and privacy rules. | Avatar/receipt storage blocked. |
| Monitoring | Platform logs first | No | Yes | Choose Sentry/equivalent later. | Production incidents harder to detect. |
| Domain | Use preview URL | No | Yes | Prepare DNS access later. | Public launch delayed. |
| Legal/terms/privacy | Draft before public staging | No for internal fake-data staging | Yes | Approve terms, privacy, data handling. | Public launch unsafe. |
| Refund/payout policy | Defer implementation, decide before payment | No | Yes | Approve refund, cancellation, payout, KYC rules. | Paid launch and payouts blocked. |
| Staging access method | Protected URL plus auth/admin plan | Yes | Yes | Decide who can enter staging and how. | Staging may be inaccessible or exposed. |

## What Can Stay Manual Or Mock For Internal Staging

- Payment provider and online checkout.
- Manual payment approval using fake references.
- Payout and settlement operations.
- Email/SMS/Telegram/WhatsApp communication.
- Notification delivery outside the app.
- Uploads, if testers avoid real profile images and real receipts.
- External analytics and monitoring.
- Domain and DNS.
- Public SEO/indexing.

## What Blocks Production Launch

- Production auth provider and session architecture.
- Admin/support bootstrap and role management.
- Payment provider integration, callback/webhook verification, and reconciliation.
- Refund, cancellation, payout, settlement, tax, and KYC policy.
- Object storage for avatars and payment/identity-sensitive files.
- Email/SMS notification delivery where product requires it.
- Monitoring/error reporting and PII-safe logging.
- Legal terms, privacy policy, and data retention rules.
- Production PostgreSQL provisioning, backup, restore, and migration runbook.
- Domain, SSL, HSTS, and indexing approval.

## What Not To Connect Yet

- Production domain or DNS.
- Real payment provider.
- Real payout/settlement service.
- Production auth provider unless the founder explicitly chooses it for the next checkpoint.
- Email/SMS provider accounts.
- Object storage buckets with real user files.
- External analytics.
- Production monitoring with real PII.
- Production database.

## Recommended Next Technical Checkpoint

Checkpoint 3B-5 should be: Staging Access, Admin Bootstrap, Seed Data, and Migration Runbook.

It should answer and implement only what is needed before the first actual staging deployment:

- Confirm hosting target and staging URL pattern.
- Decide whether staging uses real auth or a restricted staging-only access mechanism.
- Define first ADMIN and SUPPORT bootstrap flow.
- Define safe seed data for staging.
- Create a non-destructive staging migration runbook.
- Add a staging preflight checklist or script that validates env variable presence without printing values.
- Keep payment, upload, notifications, domain, and monitoring disabled/manual.

## Exact Next Prompt

Approve Checkpoint 3B-5: Staging Access, Admin Bootstrap, Seed Data, and Migration Runbook.

Do not deploy. Do not connect Vercel, DNS, domain, payment, email, SMS, storage, analytics, or monitoring. Do not print secrets.

Inspect the 3B-4 staging decision map, deployment checklist, env examples, auth/session code, admin guards, Prisma schema/migrations, seed scripts, CI workflow, and current tests.

Implement only the smallest safe pre-deployment staging preparation:

1. Add or update documentation for staging access, admin bootstrap, seed data, migration runbook, and env preflight.
2. If useful, add a non-secret env preflight script/test that checks required staging env variable names without printing values.
3. Do not implement production auth provider, payment provider, payouts, email/SMS delivery, object storage, monitoring, domain, or deployment.
4. Do not create migrations.
5. Do not stage or commit unless I explicitly approve final stage-and-commit.

After changes, run lint, typecheck, tests, build, Prisma validate, Prisma generate, and Prisma migrate status using `.env.local.txt` silently if Prisma needs env.

Return changed files, command results, remaining blockers, and whether the repo is ready for an actual internal staging deployment attempt.
