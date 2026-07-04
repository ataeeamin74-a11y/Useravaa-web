# Useravaa Launch Decision Lock v1

Status: Decision locked for subsequent implementation phases.

## 1. Public Launch Decision

- Public URL: https://useravaa.com
- Public launch product: Career Path Discovery PWA
- The root route `/` must become the public product surface in a later implementation phase.
- `/career` is secondary and may redirect to `/` or remain available as an alias.
- The canonical public launch URL must be https://useravaa.com.

## 2. Core User Job

Users can explore, save, and compare career paths to make clearer career decisions.

## 3. Visible in Launch

- Career paths
- Search
- Career path details
- Job duties / role description
- Technical skills
- Tools and technologies
- Soft skills
- Save for further review
- Saved paths
- Compare paths
- Related paths
- Slides only when ready
- PWA installability

## 4. Hidden from Public Launch

- Mentoring
- Advisor / experience-provider profiles
- Booking
- Payment
- Chat / messages
- Marketplace
- B2B
- Subscriptions
- Provider dashboard

These layers are not being removed from the business vision. They are only excluded from the first public launch surface and must not be publicly exposed.

## 5. Route Decision

- `/` renders the Career Path Discovery PWA in the implementation phase.
- `/career` should redirect to `/` or remain available as an alias.
- The canonical URL is https://useravaa.com.
- The root page must not expose mentoring, booking, advisor, payment, marketplace, or chat flows.

## 6. Slide Decision

- Slides are not required for every career path before launch.
- The slide system must support incomplete slide coverage safely.
- Show slides only for career paths with completed slide manifest entries and assets.
- Hide the entire slide section for paths without ready slides.
- Do not show “coming soon.”
- Do not show empty carousels.
- Do not allow broken images.
- Slide content can be added gradually over 1–2 weeks or more after the core PWA is launch-ready.

## 7. Save Decision

- Save means “save for further review.”
- Do not use favorite, like, or interest framing.
- Use bookmark/save language and iconography.
- Do not use a heart icon.
- Saved paths should work locally without login or backend dependency unless explicitly changed later.

## 8. Launch Message

Approved user-facing message:

> مسیرهای شغلی را ببین، ذخیره کن و مقایسه کن تا انتخابت روشن‌تر شود.

Forbidden launch messages:

- منتور پیدا کن
- جلسه رزرو کن
- با متخصص حرف بزن
- موفقیتت را تضمین کن
- مسیرت را قطعی پیدا کن

## 9. Launch Blockers

- Root route shows the wrong product.
- Mentoring, booking, payment, advisor profiles, marketplace, or chat are exposed publicly.
- Career path discovery flow is broken.
- Save or saved paths are broken.
- Compare is broken.
- Mobile layout has serious horizontal overflow.
- Bottom navigation overlaps content.
- Build fails.
- Important console or hydration errors exist.
- Missing slide content creates broken images, an empty carousel, or placeholder UI.

## 10. Go/No-Go Checklist for Phase 1

- [ ] useravaa.com is confirmed as the public launch URL.
- [ ] Career Path Discovery PWA is confirmed as the public launch product.
- [ ] `/career` is confirmed as secondary, not the main launch destination.
- [ ] Mentoring/business marketplace layers are confirmed hidden from public launch.
- [ ] Slides are confirmed not to be a launch blocker.
- [ ] Save is confirmed as “save for further review,” not favorite/like.
- [ ] Launch message is approved.
