# phase-1-scaffold-complete

Checkpoint for the approved Phase 1 scaffold.

## Included Scope

- Numbered handoff files and folders are organized under `docs/handoff/`.
- `prototype/index.html`, `prototype/styles.css`, and `prototype/script.js` are preserved as unchanged V51 reference files.
- Next.js App Router scaffold is in place under `src/app/`.
- Route placeholders exist for all routes from `docs/handoff/02_ROUTES_MAP.csv`.
- V51-style sticky header foundation is implemented with CSS Modules.
- RTL Persian root layout uses `lang="fa"` and `dir="rtl"`.
- Global CSS variables are based on the V51 design tokens.
- Prisma schema is copied from `docs/handoff/06_DATA_MODEL/prisma.schema` to `prisma/schema.prisma`.
- Adapter boundaries exist for auth, payment, uploads, notifications, and database access.

## Verification

The following Phase 1 checks passed after scaffolding:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

Build output used:

- Next.js `16.2.6`
- React `19.2.6`
- Prisma packages `7.8.0`
- Zod `4.4.3`

## Prisma Engine Limitation

This local environment could install Prisma packages, but Prisma engine download from `https://binaries.prisma.sh` failed with DNS resolution error `getaddrinfo ENOENT binaries.prisma.sh`.

Because of that, `prisma generate` is intentionally available as `npm run prisma:generate`, but it is not part of `npm run typecheck` or `npm run build` in this checkpoint. The generated Prisma client should be enabled in a CI/development environment where Prisma engine binaries are reachable or pre-cached.

Until then, Phase 1 keeps the Prisma schema and database adapter boundary in place without wiring business data access.

## Git Status

An actual Git commit could not be created in this environment because:

- No `.git/` directory exists in the workspace.
- `git` is not available on PATH.
- No Git executable was found in the usual Windows installation locations.

This file is the named checkpoint artifact for `phase-1-scaffold-complete`.
