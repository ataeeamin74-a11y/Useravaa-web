# Useravaa Career Path Share Preview QA v1

## Scope

This checklist covers social preview QA for representative Career path SEO pages. It is limited to share metadata, canonical URLs, robots metadata, sitemap inclusion, and schema safety for public path pages.

## Representative URLs

- `https://useravaa.com/career/paths/seo`
- `https://useravaa.com/career/paths/performance-marketing`
- `https://useravaa.com/career/paths/product-management-and-ownership`
- `https://useravaa.com/career/paths/dotnet-c-sharp-backend`

## Automated Coverage

- Each representative URL has path-specific title and description metadata.
- Canonical URL and `og:url` match the page URL.
- Robots metadata remains `index, follow`.
- Open Graph and Twitter/X preview fields use the approved share image at `https://useravaa.com/og/useravaa-career-share.png`.
- Sitemap coverage remains 58 unique Career path URLs.
- Structured data remains WebPage-only for representative pages.
- Public preview metadata avoids guarantees, hiring-availability claims, classroom framing, placeholders, PII, and arbitrary user text.

## Manual Checklist

- Paste `/career/paths/seo` into the LinkedIn post composer and confirm the title, description, and image are path-specific.
- Paste `/career/paths/seo` into Telegram saved messages and confirm the preview is generated.
- Paste `/career/paths/performance-marketing` into WhatsApp and confirm the preview is generated.
- Use the X/Twitter card validator if available and confirm title, description, and image.
- Use the Facebook Sharing Debugger if available and confirm title, description, and image.
- Confirm the rendered HTML for representative URLs does not include `noindex` or `nofollow`.
- Confirm the preview image is not broken and resolves over HTTPS.
- Confirm title and description are not generic placeholders.
