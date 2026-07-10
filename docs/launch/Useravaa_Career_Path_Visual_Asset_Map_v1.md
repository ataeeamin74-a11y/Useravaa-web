# Useravaa Career Path Visual Asset Map v1

This document defines the public visual asset convention consumed by `/career/paths/[slug]`.

Codex/code does not generate final artwork. The user will create these visuals manually, likely using an external visual generation workflow. The app only consumes the files if they are present under `public/career-paths/{slug}/`.

## File Convention

For every career path slug, create:

| Section | Filename | Public URL |
| --- | --- | --- |
| Hero / decision header | `hero-mascot.webp` | `/career-paths/{slug}/hero-mascot.webp` |
| این شغل مناسب منه؟ | `fit.webp` | `/career-paths/{slug}/fit.webp` |
| واقعیت‌های شغلی | `job-reality.webp` | `/career-paths/{slug}/job-reality.webp` |
| سختی‌ها | `difficulties.webp` | `/career-paths/{slug}/difficulties.webp` |
| فرصت‌ها و تهدیدهای هوش مصنوعی | `ai-impact.webp` | `/career-paths/{slug}/ai-impact.webp` |
| سوالات متداول مصاحبه شغلی | `interview-questions.webp` | `/career-paths/{slug}/interview-questions.webp` |

Recommended image size: `1600x900`.
Minimum acceptable size: `1200x675`.
Required format: WebP.
Keep file size reasonable for web delivery.

Naming rules:
- Use lowercase filenames exactly as listed.
- Place files in `public/career-paths/{slug}/`.
- Do not use external image URLs.
- Do not use stock images.
- Do not change slug folder names without updating the actual career path slug system.

Fallback behavior:
- If an expected file is missing, the page renders a brand-safe placeholder.
- Missing images do not show broken icons.
- Missing images do not change the page structure or layout ratio.
- The rendered HTML exposes the expected path through `data-expected-src` for QA.

## Slug Asset Checklist

Each slug below expects all six files listed in the convention table.

- `dotnet-c-sharp-backend` — folder `public/career-paths/dotnet-c-sharp-backend/`
- `go-backend` — folder `public/career-paths/go-backend/`
- `java-jvm-backend` — folder `public/career-paths/java-jvm-backend/`
- `node-js-typescript-backend` — folder `public/career-paths/node-js-typescript-backend/`
- `php-laravel-backend` — folder `public/career-paths/php-laravel-backend/`
- `python-django-backend` — folder `public/career-paths/python-django-backend/`
- `crm-operations` — folder `public/career-paths/crm-operations/`
- `crm-and-retention-operations` — folder `public/career-paths/crm-and-retention-operations/`
- `contact-center-operations` — folder `public/career-paths/contact-center-operations/`
- `offensive-security-penetration-testing` — folder `public/career-paths/offensive-security-penetration-testing/`
- `soc-security-monitoring-and-incident-response` — folder `public/career-paths/soc-security-monitoring-and-incident-response/`
- `analytics-and-business-insights` — folder `public/career-paths/analytics-and-business-insights/`
- `data-engineering-and-platform` — folder `public/career-paths/data-engineering-and-platform/`
- `llm-genai` — folder `public/career-paths/llm-genai/`
- `bi-dashboarding-and-reporting` — folder `public/career-paths/bi-dashboarding-and-reporting/`
- `kubernetes-platform-engineering` — folder `public/career-paths/kubernetes-platform-engineering/`
- `sre-reliability-engineering` — folder `public/career-paths/sre-reliability-engineering/`
- `angular-frontend` — folder `public/career-paths/angular-frontend/`
- `react-next-js-frontend` — folder `public/career-paths/react-next-js-frontend/`
- `vue-nuxt-frontend` — folder `public/career-paths/vue-nuxt-frontend/`
- `full-stack-dotnet-blazor` — folder `public/career-paths/full-stack-dotnet-blazor/`
- `full-stack-node-js-mern` — folder `public/career-paths/full-stack-node-js-mern/`
- `talent-acquisition` — folder `public/career-paths/talent-acquisition/`
- `hr-management` — folder `public/career-paths/hr-management/`
- `hr-operations-and-personnel-administration` — folder `public/career-paths/hr-operations-and-personnel-administration/`
- `it-support-helpdesk` — folder `public/career-paths/it-support-helpdesk/`
- `network-administration-and-infrastructure` — folder `public/career-paths/network-administration-and-infrastructure/`
- `windows-microsoft-infrastructure` — folder `public/career-paths/windows-microsoft-infrastructure/`
- `growth-marketing` — folder `public/career-paths/growth-marketing/`
- `content-and-copywriting` — folder `public/career-paths/content-and-copywriting/`
- `market-research-and-insights` — folder `public/career-paths/market-research-and-insights/`
- `social-media-and-community` — folder `public/career-paths/social-media-and-community/`
- `digital-marketing` — folder `public/career-paths/digital-marketing/`
- `seo` — folder `public/career-paths/seo/`
- `social-media-and-community-1puzks` — folder `public/career-paths/social-media-and-community-1puzks/`
- `brand-pr-and-communications` — folder `public/career-paths/brand-pr-and-communications/`
- `marketing-generalist-and-strategy` — folder `public/career-paths/marketing-generalist-and-strategy/`
- `performance-marketing` — folder `public/career-paths/performance-marketing/`
- `android-native-kotlin` — folder `public/career-paths/android-native-kotlin/`
- `logistics-operations` — folder `public/career-paths/logistics-operations/`
- `ui-ux` — folder `public/career-paths/ui-ux/`
- `product-management-and-ownership` — folder `public/career-paths/product-management-and-ownership/`
- `qa-automation-sdet` — folder `public/career-paths/qa-automation-sdet/`
- `account-management` — folder `public/career-paths/account-management/`
- `b2b-corporate-sales` — folder `public/career-paths/b2b-corporate-sales/`
- `business-development` — folder `public/career-paths/business-development/`
- `commercial-trading-operations` — folder `public/career-paths/commercial-trading-operations/`
- `market-development-merchant-acquisition` — folder `public/career-paths/market-development-merchant-acquisition/`
- `career-path-dloft3` — folder `public/career-paths/career-path-dloft3/`
- `career-path-83obo3` — folder `public/career-paths/career-path-83obo3/`
- `career-path-1vdnx4` — folder `public/career-paths/career-path-1vdnx4/`
- `career-path-19175m` — folder `public/career-paths/career-path-19175m/`
- `career-path-vdw6zx` — folder `public/career-paths/career-path-vdw6zx/`
- `career-path-ij3k84` — folder `public/career-paths/career-path-ij3k84/`
- `career-path-1pe3k9` — folder `public/career-paths/career-path-1pe3k9/`
- `3d-art` — folder `public/career-paths/3d-art/`
- `career-path-14w12j` — folder `public/career-paths/career-path-14w12j/`
- `career-path-18cutb` — folder `public/career-paths/career-path-18cutb/`
