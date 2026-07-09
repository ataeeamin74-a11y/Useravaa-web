# Useravaa Career Launch Readiness Final QA v1

## Launch Status

READY FOR CONTROLLED LAUNCH.

No launch-blocking issue was found in the inspected source, automated validation, production build, built metadata checks, local HTTP smoke, or mobile browser smoke. The launch remains controlled: production indexing, writable JSONL paths, log rotation, and deployed social-preview checks still need operator confirmation.

## Scope Checked

- Public Career PWA routes: `/`, `/career`, `/career?path=seo`, `/career/compare`, `/career/my-paths`, `/career/paths/seo`, `/career/paths/performance-marketing`, `/career/paths/product-management-and-ownership`, and `/career/paths/dotnet-c-sharp-backend`.
- Public launch endpoints: `/site.webmanifest`, `/sitemap.xml`, `/robots.txt`, `/api/career/leads`, and `/api/career/events`.
- Source areas: `src/app`, `src/app/sitemap.ts`, `src/app/robots.ts`, Career feature modules, Career API routes, deployment safety helpers, tests related to Career lead capture, events, SEO, share previews, PWA readiness, mobile conversion, and launch docs.
- Excluded by request: raw Career JSON changes, `public/career-slides`, logo assets, package files, database/Prisma, auth, marketplace, booking, payment, mentor/advisor/session flows, lead API behavior changes, event API behavior changes, GA4 changes, and deployment config changes.

## Current Commit Audited

- `bebef8d39029a459a25f3ada9770b35d27971e95`
- Short commit: `bebef8d fix: improve career mobile conversion flow`
- Branch: `feature/career-ui-benchmark-audit`

## Core Flow Result

PASS.

The local production browser smoke at `390 x 844` verified:

- Root Career PWA loads and shows the path discovery surface.
- `/career?path=seo` deep link redirects to `/?card=CARD_036` and opens the SEO path detail.
- Save path works.
- Lead sheet appears after save.
- Invalid lead submit shows full-name and Iranian-mobile validation errors.
- Valid lead submit succeeds against a mocked `/api/career/leads`.
- Saved path appears in My Paths.
- Saved path can be removed.
- Compare can be started from the path detail.
- A second path can be selected.
- Comparison can be saved.
- Saved comparison appears in My Paths.
- No horizontal overflow was detected at `390 x 844`.
- No browser console errors or page errors were recorded.

Browser smoke result:

```text
status: passed
viewport: 390x844
launchDeepLink: /career?path=seo -> /?card=CARD_036
leadRequests: 1
eventRequests: 18
eventPayloadsPiiSafe: true
horizontalOverflow: false
consoleErrors: 0
pageErrors: 0
```

## Lead Capture Result

PASS.

- Full name validation remains required and covered.
- Iranian mobile validation and `+989...` normalization remain covered.
- Invalid mobile is rejected.
- Email collection and `موبایل یا ایمیل` copy are not reintroduced.
- Honeypot behavior remains covered.
- Request size guard, malformed JSON handling, rate limiting, dedupe, append failure, and safe error responses remain covered by `tests/career-leads-api.test.ts`.
- Lead JSONL path remains `USERAVAA_CAREER_LEADS_PATH` or `/var/log/useravaa/career-leads.jsonl`.
- Raw IP is not stored in lead JSONL.
- Browser smoke mocked lead POSTs to avoid writing launch QA rows.

## Event Logging Result

PASS.

- Valid allowlisted Career events are accepted.
- Malformed, oversized, unknown, rate-limited, and append-failure cases remain covered.
- Event payload sanitization strips PII-like fields and raw search text.
- Raw IP is not stored in event JSONL.
- UI flow does not break when event tracking fails, covered by `tests/career-launch-core-flow.test.tsx` and `tests/career-events.test.ts`.
- Browser smoke observed `18` mocked event calls and confirmed no event payload contained `fullName`, `phone`, `contact`, `+989`, `091`, `۰۹۱`, ambiguity text, or arbitrary user text.

## SEO / Discoverability Result

PASS.

- `generateStaticParams()` and the production build generated Career path SSG pages.
- Built sitemap check: `59` total URLs, `58` unique `/career/paths/` URLs, root URL present.
- Representative path pages returned HTTP `200` in local production HTTP smoke.
- Representative path HTML contains `robots` metadata of `index, follow`.
- Representative path HTML does not contain `noindex` or `nofollow`.
- Canonical URLs remain `https://useravaa.com/career/paths/[slug]`.
- Structured data remains `WebPage`.
- No `JobPosting` or `Course` schema was found in representative built pages.
- `/career` returns `308` to `/`.
- `/career?path=seo` returns `308` to `/?card=CARD_036`.

Note: the local default build served `robots.txt` with `Disallow: /` because indexing is intentionally gated. Production launch must set `APP_ENV=production` and `USERAVAA_SITE_INDEXING=1` before enabling public indexing.

## Share Preview Result

PASS.

Representative built HTML was checked for:

- `og:title`
- `og:description`
- `og:url`
- `og:site_name` = `Useravaa`
- `og:type` = `website`
- `og:image` = `https://useravaa.com/og/useravaa-career-share.png`
- `twitter:card` = `summary_large_image`
- `twitter:title`
- `twitter:description`
- `twitter:image` = `https://useravaa.com/og/useravaa-career-share.png`
- path-specific titles and descriptions
- no generic placeholder title/description
- no forbidden job-board/course/hype language in metadata tests

Representative URLs checked:

- `https://useravaa.com/career/paths/seo`
- `https://useravaa.com/career/paths/performance-marketing`
- `https://useravaa.com/career/paths/product-management-and-ownership`
- `https://useravaa.com/career/paths/dotnet-c-sharp-backend`

## Mobile UX Result

PASS.

- Local browser smoke at `390 x 844` completed save, lead, My Paths, remove, compare, and saved-comparison flows.
- No horizontal overflow detected.
- Bottom navigation did not block the exercised controls.
- Lead sheet validation and sticky action behavior remained usable in the smoke path.
- Compare selected-count guidance appeared when the second path was selected.
- My Paths counts and empty states remain covered by integration tests.

## Accessibility Result

PASS for launch basics.

- Primary path save button has an accessible name.
- Lead fields have labels.
- Lead validation messages are visible and announced via existing alert regions.
- Bottom navigation has accessible labels.
- My Paths saved-path and saved-comparison counts have descriptive `aria-label` values.
- Compare selection tray has live selected-count guidance.

## Security / Privacy Result

PASS for the scoped launch surface.

- Lead API hardening remains covered: request size guard, malformed JSON handling, rate limiting, dedupe, append failure, safe 500, and no raw IP storage.
- Event API hardening remains covered: request size guard, malformed JSON handling, unknown-event rejection, rate limiting, append failure, safe 500, PII stripping, and no raw IP storage.
- No stack traces, file paths, request bodies, full phone numbers, or full names are exposed in public API error responses under covered cases.
- Baseline security headers remain configured in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`.
- HSTS remains opt-in through `USERAVAA_ENABLE_HSTS=1`.
- No secrets were introduced.

## Validation Results

```text
npm run lint
PASS
eslint .
```

```text
npm run typecheck
PASS
tsc --noEmit
```

```text
npm test
PASS
Test Files: 71 passed (71)
Tests: 722 passed (722)
Duration: 3.49s
```

```text
npm run build
PASS
Next.js 16.2.6 (Turbopack)
Compiled successfully
Generated static pages: 83/83
Career path route: /career/paths/[slug] with /career/paths/dotnet-c-sharp-backend and +55 more paths
```

Local HTTP smoke against `next start -p 3101`:

```text
/                                             200
/career                                       308 -> /
/career?path=seo                             308 -> /?card=CARD_036
/career/paths/seo                            200, index/follow
/career/paths/performance-marketing          200, index/follow
/career/paths/product-management-and-ownership 200, index/follow
/career/paths/dotnet-c-sharp-backend         200, index/follow
/career/compare                              200
/career/my-paths                             200
/site.webmanifest                            200, application/manifest+json
/sitemap.xml                                 200, 58 Career path URLs
/robots.txt                                  200, local default Disallow: /
```

## Production Deployment Checklist

Before deployment:

```bash
git status --short --branch
git rev-parse HEAD
npm ci
npm run lint
npm run typecheck
npm test
```

Build with production launch indexing only when the public domain is ready:

```bash
APP_ENV=production \
USERAVAA_SITE_INDEXING=1 \
APP_BASE_URL=https://useravaa.com \
npm run build
```

Runtime environment:

```bash
APP_ENV=production
APP_BASE_URL=https://useravaa.com
USERAVAA_SITE_INDEXING=1
USERAVAA_CAREER_LEADS_PATH=/var/log/useravaa/career-leads.jsonl
USERAVAA_CAREER_EVENTS_PATH=/var/log/useravaa/career-events.jsonl
USERAVAA_ENABLE_HSTS=0
```

Set `USERAVAA_ENABLE_HSTS=1` only after HTTPS, domain ownership, and rollback comfort are confirmed.

Operational checks:

- Ensure `/var/log/useravaa/` exists and is writable by the app process.
- Ensure log rotation or another retention process covers `career-leads.jsonl` and `career-events.jsonl`.
- Confirm PM2 or the production process manager restarts the app after deploy.
- Confirm no real payment, booking, marketplace, mentor/advisor/session launch claims are introduced.

## Production Smoke Test Checklist

HTTP route checks:

```bash
curl -I https://useravaa.com/
curl -I https://useravaa.com/career
curl -I "https://useravaa.com/career?path=seo"
curl -I https://useravaa.com/career/paths/seo
curl -I https://useravaa.com/career/paths/performance-marketing
curl -I https://useravaa.com/career/compare
curl -I https://useravaa.com/career/my-paths
curl -I https://useravaa.com/site.webmanifest
curl -I https://useravaa.com/sitemap.xml
curl -I https://useravaa.com/robots.txt
```

SEO and sitemap checks:

```bash
curl -sS https://useravaa.com/career/paths/seo | grep -Ei 'robots|canonical|og:title|og:description|og:image|twitter:card'
curl -sS https://useravaa.com/career/paths/seo | grep -Eio 'noindex|nofollow|JobPosting|Course' || true
curl -sS https://useravaa.com/sitemap.xml | grep -o 'https://useravaa.com/career/paths/' | wc -l
curl -sS https://useravaa.com/robots.txt
```

Expected:

- `/career/paths/seo` has canonical, OG, Twitter, and `index, follow`.
- no `noindex` or `nofollow` on `/career/paths/[slug]` pages.
- sitemap count for `https://useravaa.com/career/paths/` is `58`.
- production `robots.txt` allows launch pages when `APP_ENV=production` and `USERAVAA_SITE_INDEXING=1`.

API smoke checks:

```bash
curl -sS -X POST https://useravaa.com/api/career/events \
  -H 'content-type: application/json' \
  -d '{"event":"career_entry","sessionId":"launch-smoke","payload":{"source":"root"}}'
```

For lead capture, prefer a browser smoke with an approved internal test mobile number, then verify one JSONL row was appended and no raw IP is stored. Do not use a real prospect's phone number for launch smoke.

Manual browser checks:

- Open `/` on mobile viewport and real mobile Safari/Chrome if available.
- Save a path and confirm lead sheet appears.
- Submit invalid lead and confirm Persian validation.
- Submit a valid internal test lead and confirm success.
- Open My Paths and confirm saved path appears.
- Remove saved path.
- Start comparison, select two paths, save comparison, and confirm it appears in My Paths.
- Paste `/career/paths/seo` into LinkedIn, Telegram, WhatsApp, and X/Twitter preview tools where available.
- Confirm share title, description, and image are not generic or broken.

## Rollback Checklist

Prefer the deployment platform's previous successful release rollback if available.

If a code rollback is needed in git:

```bash
git status --short --branch
git log --oneline -5
git revert --no-edit <launch_commit_sha>
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Then redeploy or restart the production process manager:

```bash
pm2 status
pm2 restart <useravaa-process-name>
```

If rollback is caused by lead/event writes:

- Preserve the JSONL files before intervention.
- Stop the app process if bad writes are continuing.
- Restore the previous deploy.
- Restart the app.
- Verify `/`, `/api/career/leads`, and `/api/career/events` health with safe smoke requests.

Do not use `git reset --hard`, `git clean`, or destructive database commands as the first rollback move.

## Known Non-Blocking Risks

- Production indexing depends on correct env flags: `APP_ENV=production` and `USERAVAA_SITE_INDEXING=1`.
- Social crawler caches and real LinkedIn/Telegram/WhatsApp/X previews still require deployed URL checks.
- Real mobile keyboard and browser chrome behavior should get a quick real-device pass.
- Lead and event storage are JSONL files; production needs writable path ownership, retention, backup, and monitoring.
- Lead/event rate limiting and dedupe are in-memory and process-local, acceptable for the current controlled PM2/VPS deployment but not a multi-instance design.
- No admin lead export UI or alerting dashboard exists yet.
- No Search Console submission has been performed in this repo task.
- No service worker/offline mode is present; this is not blocking the controlled launch.

## Launch Blockers

None found.

## Recommended Next Steps After Launch

- Run the production smoke checklist immediately after deploy.
- Submit sitemap in Search Console after production indexing is intentionally enabled.
- Monitor JSONL append health, file permissions, disk usage, and rate-limit behavior during first traffic.
- Review first real lead rows for expected structure without raw IP.
- Review first event rows for PII-safe payloads.
- Run social preview tools on the four representative SEO URLs.
- Plan P2 operational work: lead export/admin review, monitoring/alerting, multi-process rate limiting if traffic grows, and a formal browser E2E job if the current test stack is extended.
