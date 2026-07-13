# Useravaa Career Path Deep Research Ingestion Plan v1

This document defines the private source-material workflow for deep research Word files. The 59-report corpus was ingested on 2026-07-13 with `scripts/ingest-career-research.mjs` and reconciled to the approved 58-path product taxonomy; final DOCX files remain private source material and the product consumes a validated, generated appendix payload.

## Private Path Convention

Future source files should live outside `public/`:

`content/career-research/{slug}/deep-research.docx`

Examples:
- `content/career-research/seo/deep-research.docx`
- `content/career-research/performance-marketing/deep-research.docx`
- `content/career-research/product-management-and-ownership/deep-research.docx`

These DOCX files are source material for future product-screen content generation. They must not be served as public assets.

## Ingestion Rules

- Do not add a DOCX parsing package. The ingestion script validates the source manifest and Markdown product appendix, then copies the matching final DOCX as private source material.
- Do not expose DOCX files from `public/` or parse them at request/build time.
- Keep ingestion an explicit, repeatable script rather than a build-pipeline dependency.
- Ingestion must not happen blindly.
- The current sitemap has 58 career path URLs.
- Social-media content creation and social-media management are separate source reports but one approved product path: `social-media-marketing` / «بازاریابی شبکه‌های اجتماعی».
- The social-media merge must preserve production/craft evidence from the content-creation report and strategy/community/performance evidence from the management report, while deduplicating shared fit, hardship, workflow, and AI material by meaning.
- Both social-media source files and checksums must remain in the generated record provenance. Every legacy social-media slug, card ID, and saved path ID resolves to the single canonical path.
- A slug reconciliation report must be created or refreshed before ingestion.
- Reconciliation must identify unmatched DOCX folders, missing DOCX files for existing slugs, and any duplicate or renamed paths.
- Extracted research must be transformed into the product-screen sections, not copied as article text.
- Research content must be filtered for Useravaa tone: clear, human, decision-oriented, non-hype.
- Do not introduce job-board, course, mentor, booking, payment, or session language.
- Do not introduce absolute claims.
- Do not invent uncited market claims.

## Future Section Mapping

Research should be transformed into:
- Hero / decision header
- این شغل مناسب منه؟
- واقعیت‌های شغلی
- سختی‌ها
- فرصت‌ها و تهدیدهای هوش مصنوعی
- سوالات متداول مصاحبه شغلی
- Final CTA / decision action area

Do not transform research into generic blog sections or long-form article paragraphs.

## Expected DOCX Paths

The 58 current sitemap paths are backed by 59 private source files. Most canonical paths have one matching source; the social-media canonical record intentionally consumes the following two source-only folders, neither of which is a public route:

- `content/career-research/social-media-content-creation/deep-research.docx`
- `content/career-research/social-media-management/deep-research.docx`

The remaining private source paths are:

- `content/career-research/dotnet-c-sharp-backend/deep-research.docx`
- `content/career-research/go-backend/deep-research.docx`
- `content/career-research/java-jvm-backend/deep-research.docx`
- `content/career-research/node-js-typescript-backend/deep-research.docx`
- `content/career-research/php-laravel-backend/deep-research.docx`
- `content/career-research/python-django-backend/deep-research.docx`
- `content/career-research/crm-operations/deep-research.docx`
- `content/career-research/crm-and-retention-operations/deep-research.docx`
- `content/career-research/contact-center-operations/deep-research.docx`
- `content/career-research/offensive-security-penetration-testing/deep-research.docx`
- `content/career-research/soc-security-monitoring-and-incident-response/deep-research.docx`
- `content/career-research/analytics-and-business-insights/deep-research.docx`
- `content/career-research/data-engineering-and-platform/deep-research.docx`
- `content/career-research/llm-genai/deep-research.docx`
- `content/career-research/bi-dashboarding-and-reporting/deep-research.docx`
- `content/career-research/kubernetes-platform-engineering/deep-research.docx`
- `content/career-research/sre-reliability-engineering/deep-research.docx`
- `content/career-research/angular-frontend/deep-research.docx`
- `content/career-research/react-next-js-frontend/deep-research.docx`
- `content/career-research/vue-nuxt-frontend/deep-research.docx`
- `content/career-research/full-stack-dotnet-blazor/deep-research.docx`
- `content/career-research/full-stack-node-js-mern/deep-research.docx`
- `content/career-research/talent-acquisition/deep-research.docx`
- `content/career-research/hr-management/deep-research.docx`
- `content/career-research/hr-operations-and-personnel-administration/deep-research.docx`
- `content/career-research/it-support-helpdesk/deep-research.docx`
- `content/career-research/network-administration-and-infrastructure/deep-research.docx`
- `content/career-research/windows-microsoft-infrastructure/deep-research.docx`
- `content/career-research/growth-marketing/deep-research.docx`
- `content/career-research/content-and-copywriting/deep-research.docx`
- `content/career-research/market-research-and-insights/deep-research.docx`
- `content/career-research/digital-marketing/deep-research.docx`
- `content/career-research/seo/deep-research.docx`
- `content/career-research/brand-pr-and-communications/deep-research.docx`
- `content/career-research/marketing-generalist-and-strategy/deep-research.docx`
- `content/career-research/performance-marketing/deep-research.docx`
- `content/career-research/android-native-kotlin/deep-research.docx`
- `content/career-research/logistics-operations/deep-research.docx`
- `content/career-research/ui-ux/deep-research.docx`
- `content/career-research/product-management-and-ownership/deep-research.docx`
- `content/career-research/qa-automation-sdet/deep-research.docx`
- `content/career-research/account-management/deep-research.docx`
- `content/career-research/b2b-corporate-sales/deep-research.docx`
- `content/career-research/business-development/deep-research.docx`
- `content/career-research/commercial-trading-operations/deep-research.docx`
- `content/career-research/market-development-merchant-acquisition/deep-research.docx`
- `content/career-research/career-path-1drths/deep-research.docx`
- `content/career-research/career-path-fmhiml/deep-research.docx`
- `content/career-research/career-path-1bed9m/deep-research.docx`
- `content/career-research/career-path-1b5cj3/deep-research.docx`
- `content/career-research/career-path-1gt2jj/deep-research.docx`
- `content/career-research/graphic-design-and-visual-content/deep-research.docx`
- `content/career-research/career-path-1w9y14/deep-research.docx`
- `content/career-research/career-path-1u9xrl/deep-research.docx`
- `content/career-research/3d-art/deep-research.docx`
- `content/career-research/career-path-1lo6cj/deep-research.docx`
- `content/career-research/career-path-1rtxp8/deep-research.docx`
