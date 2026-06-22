# Useravaa V51 Arvan Staging Deploy Runbook

Last reviewed: 2026-06-23

This runbook prepares internal staging deployment to Arvan Cloud Container. It does not deploy the app, connect a domain, create a registry, push an image, run migrations against the real staging database, or store secrets in source control.

## Arvan Services Needed

- Managed Database PostgreSQL: already created manually for staging as `useravaa-staging-db` on PostgreSQL 17.9.
- Cloud Container app: create later from the committed Dockerfile and a container image produced by the approved deployment flow.

Do not paste database passwords, full connection strings, auth secrets, JWT secrets, or provider keys into docs, commits, screenshots, tickets, or chat.

## Recommended Container Shape

- Build the Next.js app into a Docker image.
- Generate Prisma Client during image build with a harmless build-only placeholder database URL.
- Start the container with `npm start`.
- Supply real staging configuration only through Arvan Cloud Container environment variables.
- Keep database migrations as a separate explicit operator step. Do not run migrations automatically on every app startup.

This keeps the image reusable, avoids baking secrets into layers, and avoids surprise database writes when Arvan restarts or scales a container.

## DATABASE_URL Assembly

Build `DATABASE_URL` only inside the Arvan app environment settings from the managed PostgreSQL connection details:

1. Use the PostgreSQL protocol.
2. Add the Arvan database username.
3. Add the Arvan database password.
4. Add the Arvan database host and port.
5. Add the staging database name.
6. Add the `schema=public` query parameter if the connection UI does not already include it.

Store the final assembled value only in Arvan environment settings. Do not add it to `.env.example`, docs, GitHub Actions, commits, screenshots, or local notes.

## Required Arvan Staging Env Names

Enter these names in Arvan Cloud Container app settings. Values below are posture guidance only; use real values only in the Arvan panel where required.

| Env name | Staging posture |
|---|---|
| `APP_ENV` | `staging` |
| `APP_BASE_URL` | Arvan staging app URL |
| `API_BASE_URL` | Arvan staging app API base URL |
| `DATABASE_URL` | Staging PostgreSQL connection, stored only in Arvan |
| `AUTH_SECRET` | Staging-only secret, stored only in Arvan |
| `JWT_SECRET` | Staging-only secret, stored only in Arvan |
| `USERAVAA_SITE_INDEXING` | `0` |
| `USERAVAA_ENABLE_HSTS` | `0` |
| `USERAVAA_ENABLE_DEV_AUTH` | `0` |
| `USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK` | `0` |
| `USERAVAA_ENABLE_STAGING_ACCESS` | `0` initially |
| `USERAVAA_DB_SMOKE_TEST` | `0` initially |
| `LOG_LEVEL` | `info`, `warn`, or `error` |
| `PAYMENT_PROVIDER` | disabled or manual value already supported by the repo |
| `EMAIL_PROVIDER` | disabled |
| `SMS_PROVIDER` | disabled |
| `UPLOAD_STORAGE_PROVIDER` | disabled |

Keep `STAGING_PRIMARY_ADMIN_EMAIL`, `STAGING_SUPPORT_EMAIL`, `USERAVAA_STAGING_ACCESS_HEADER`, `USERAVAA_STAGING_ACCESS_IDENTITY_HEADER`, and `USERAVAA_STAGING_ACCESS_SECRET` unset until the protected staging identity header source is configured and reviewed.

## Migration Handling

Recommended staging sequence:

1. Confirm the Arvan `DATABASE_URL` points to the staging database, not production.
2. Run `npx prisma migrate status` from an approved operator environment.
3. Run `npx prisma migrate deploy` only as a deliberate staging migration step.
4. Start or restart the Cloud Container app with `npm start`.

Do not run `prisma migrate reset`. Do not run `prisma db push`. Do not wire `prisma migrate deploy` into the container start command.

## Do Not Connect Yet

- Domain
- Payment provider
- Email or SMS provider
- Upload/object storage provider
- Analytics or monitoring provider
- Production data
- Production auth provider

## First Deploy Smoke Checklist

- Staging URL loads.
- `robots.txt` remains noindex for staging.
- Public home page renders.
- Public `/discover` renders.
- Public `/insights` renders.
- Private pages remain blocked for anonymous users.
- `/admin` remains blocked unless the trusted staging identity source is later configured.
- Logs do not show secrets or full database connection strings.
- No real email, SMS, payment, storage, analytics, or production-data flows are connected.
