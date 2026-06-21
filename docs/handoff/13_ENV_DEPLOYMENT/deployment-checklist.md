# Useravaa Deployment Readiness Checklist

This checklist is for controlled staging and later production readiness. It does not replace final Product, Legal, Finance, Security, or Operations approval.

## Before Internal Staging

- Confirm staging is internal-only.
- Use a non-production PostgreSQL database.
- Keep `APP_ENV=staging` and `USERAVAA_SITE_INDEXING=0`.
- Keep `USERAVAA_DB_SMOKE_TEST=0` in shared CI; enable smoke tests only from a safe local/operator machine.
- Keep `USERAVAA_ENABLE_DEV_AUTH=0` and `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0` for deployment environments.
- Run `npm.cmd run lint`.
- Run `npm.cmd run typecheck`.
- Run `npm.cmd run test -- --pool=threads --maxWorkers=1`.
- Run `npm.cmd run build`.
- Run `npx.cmd prisma validate`.
- Run `npx.cmd prisma generate`.
- Run `npx.cmd prisma migrate status` against the staging database.
- Verify `/discover`, `/insights`, `/profiles/[profileId]`, `/login`, `/register`, `/support`, and guarded private/admin pages.
- Verify `/robots.txt` blocks indexing.

## Before Public Staging

- Replace fixture/dev auth with the selected production auth provider.
- Define the first ADMIN and SUPPORT account creation process.
- Confirm admin pages and admin APIs reject normal users.
- Confirm no payment provider, payout, notification, storage, or analytics claims are shown as production-ready.
- Add access control around the public staging URL if real user data appears.
- Verify no public logo/avatar leftovers or local artifacts are included in the release commit.

## Before Production Launch

- Set `APP_ENV=production`.
- Set `USERAVAA_SITE_INDEXING=1` only after SEO/legal/product approval.
- Set `USERAVAA_ENABLE_HSTS=1` only after HTTPS/domain setup is verified.
- Provision the production PostgreSQL database.
- Run migrations with a rollback plan.
- Run seed scripts only when the target data and environment are confirmed.
- Configure production auth.
- Configure payment provider and webhook handling.
- Configure object storage for uploads.
- Configure notification/email/SMS delivery.
- Configure monitoring/error reporting.
- Complete privacy, terms, refund, wallet, payout, tax, and settlement reviews.

## Required External Accounts

- Hosting platform.
- Production PostgreSQL provider.
- Auth provider.
- Payment provider.
- Object storage provider.
- Email/SMS/notification provider.
- Monitoring/error tracking provider.
- Domain/DNS provider.

## Required Environment Variables

- `APP_ENV`
- `APP_BASE_URL`
- `API_BASE_URL`
- `USERAVAA_SITE_INDEXING`
- `USERAVAA_ENABLE_HSTS`
- `DATABASE_URL` or `PRISMA_ACCELERATE_URL`
- `AUTH_SECRET`
- `JWT_SECRET`
- `UPLOAD_STORAGE_PROVIDER`
- `UPLOAD_BUCKET`
- `PAYMENT_PROVIDER`
- `PAYMENT_CALLBACK_URL`
- `PAYMENT_WEBHOOK_SECRET`
- `NOTIFICATION_PROVIDER`
- `EMAIL_PROVIDER`
- `SMS_PROVIDER`
- `LOG_LEVEL`
- `SENTRY_DSN`

## Database Actions

- Confirm the target database is not production before smoke testing.
- Run `npx.cmd prisma migrate status`.
- Run `npx.cmd prisma migrate deploy` only after a migration review.
- Never run `prisma migrate reset` or destructive commands against shared environments.
- Confirm backups and restore access before production migration.

## Auth Decisions

- Select provider.
- Define allowed login methods.
- Define ADMIN/SUPPORT bootstrap process.
- Define user role update process.
- Confirm dev fixture auth is disabled in deployment environments.

## Payment And Wallet Decisions

- Select payment provider.
- Confirm manual payment operating process.
- Confirm refund, wallet credit, payout, settlement, and reconciliation policy.
- Confirm webhook retry and reconciliation reporting.

## Notification And Storage Decisions

- Select object storage provider and upload validation limits.
- Select email/SMS/notification provider.
- Define delivery retry and failure handling.
- Confirm private receipt/proof access rules.

## Backup And Restore Checklist

- Confirm automated database backups.
- Test restore into a non-production database.
- Document recovery point objective and recovery time objective.
- Confirm who can initiate restore.

## Rollback Checklist

- Keep the previous deployable artifact available.
- Confirm database rollback strategy before each migration.
- Have a feature-disable path for payment finalization and provider visibility if operations fail.
- Check logs and admin audit entries after rollback.

## Smoke Test Checklist

- Public pages load.
- Private pages redirect or deny without auth.
- Admin pages deny normal users.
- Admin read models load for ADMIN/SUPPORT.
- Request creation works in non-production.
- Manual payment review works in non-production.
- Time proposal and selection work in non-production.
- Cancellation and wallet credit smoke tests run only against safe non-production DBs.
- `/robots.txt` matches the intended indexing mode.

## Founder Actions Outside Codex

- Decide whether staging remains internal-only.
- Choose hosting target.
- Choose production PostgreSQL provider.
- Choose auth provider.
- Choose payment provider.
- Choose notification/storage/monitoring providers.
- Approve public launch copy, legal terms, refund rules, and financial operations.
