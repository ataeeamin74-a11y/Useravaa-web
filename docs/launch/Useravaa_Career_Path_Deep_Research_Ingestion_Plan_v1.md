# Useravaa Career Path Deep Research Ingestion Plan v1

This document defines the future private source-material workflow for deep research Word files. It is documentation only. The current app does not parse DOCX files, import DOCX files, or change the build pipeline.

## Private Path Convention

Future source files should live outside `public/`:

`content/career-research/{slug}/deep-research.docx`

Examples:
- `content/career-research/seo/deep-research.docx`
- `content/career-research/performance-marketing/deep-research.docx`
- `content/career-research/product-management-and-ownership/deep-research.docx`

These DOCX files are source material for future product-screen content generation. They must not be served as public assets.

## Ingestion Rules

- Do not add a DOCX parsing package until ingestion is explicitly requested.
- Do not import DOCX files into the app now.
- Do not change the build pipeline now.
- Ingestion must not happen blindly.
- There may be 59 research docs while the current sitemap has 58 career path URLs.
- Codex must first create a slug reconciliation report before ingestion.
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

Each current sitemap career slug expects this private source path:

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
- `content/career-research/social-media-and-community/deep-research.docx`
- `content/career-research/digital-marketing/deep-research.docx`
- `content/career-research/seo/deep-research.docx`
- `content/career-research/social-media-and-community-1puzks/deep-research.docx`
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
- `content/career-research/career-path-dloft3/deep-research.docx`
- `content/career-research/career-path-83obo3/deep-research.docx`
- `content/career-research/career-path-1vdnx4/deep-research.docx`
- `content/career-research/career-path-19175m/deep-research.docx`
- `content/career-research/career-path-vdw6zx/deep-research.docx`
- `content/career-research/career-path-ij3k84/deep-research.docx`
- `content/career-research/career-path-1pe3k9/deep-research.docx`
- `content/career-research/3d-art/deep-research.docx`
- `content/career-research/career-path-14w12j/deep-research.docx`
- `content/career-research/career-path-18cutb/deep-research.docx`
