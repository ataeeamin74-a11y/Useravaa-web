# Useravaa Brand Compliance QA v1

## Task Scope

Audit the committed root Career PWA for compliance with the locked Useravaa visual and messaging system. This was a read-only product review apart from creating this report. No application code, behavior, data, route, backend, Prisma, authentication, package, marketplace, booking, or payment file was changed.

## Current Commit Reference

- Root launch implementation: `0923e9f32b3f55bf84684ce0b21e51a70425f945` — `feat: launch career pwa at root`
- Current HEAD: `14505f19ca40b28593108b0db7c18548372a850f` — `docs: record post-commit working tree cleanup`

## Brand Rules Used

- Main CTA: UA Blue `#245FFD` only.
- Highlights: UA Teal `#01C3B9` only.
- Headlines and primary text: UA Navy `#091B49`.
- Backgrounds: White `#FFFFFF` or an approved very light background.
- Gradient, if used: Teal to Blue only.
- No yellow, gold, orange, decorative red, decorative purple, off-brand green, or generic advertising colors.
- Messaging must be experience-led, decision-oriented, human, clear, and non-exaggerated.
- Core message: real experience for better decisions.
- The product must not resemble a job board, education platform, generic mentoring/coaching product, advertising template, or motivational service.
- No guaranteed outcomes, guaranteed hiring, life transformation, fast success, or perfect-path certainty.

## Page-by-Page Review

### Root and Paths

The hierarchy, search, compact navigation, white/light surfaces, and Navy typography support a clear decision flow. The visible product navigation remains Paths, Compare, and Saved Paths; no marketplace, mentoring, advisor, booking, payment, chat, B2B, subscription, or provider-dashboard label is present in the Career shell source.

Brand compliance fails because the hero highlight, step states, one-third of domain icons, item counts, search-result reasons, and header product marker use Yellow. The hero copy is decision-oriented but leads with analysis of job advertisements rather than real human experience. That framing risks making Useravaa feel data-index/job-board adjacent.

### Career Detail / Level 4

The hierarchy path, duties, skills, tools, saved action, related paths, and optional carousel are useful and decision-oriented. Headings and core surfaces are Navy/White/light gray.

Brand compliance fails in the highlighted seniority border, technical-skill emphasis, job-description rule, saved state, management badge, soft-skill tags, reset action, and related-path label. These use Yellow or Persimmon/Orange. Connection Blue `#0974C5` is also used for priority tools and tool tags even though it is not part of the locked launch palette supplied for this audit.

### Save / Saved Paths

The empty state is human and practical. Its primary action uses UA Blue, its icon uses UA Teal, and it avoids favorite/heart framing. The filled saved-state control, however, uses Persimmon/Orange and therefore fails the locked palette.

### Compare

Compare is the strongest brand-compliant surface. Its primary CTA and active controls use UA Blue; informational highlights use UA Teal; surfaces are White/Soft BG; labels are decision-oriented; and the interaction does not resemble mentoring or a job board. No Yellow or Persimmon source usage was found in `ComparePage.module.css`.

### Related Paths

The related-path structure is restrained and useful. The featured rule and icon use Teal correctly, but the `پیشنهاد نزدیک` label uses a Yellow tint and therefore fails the highlight rule.

### Slide Carousel

The carousel component chrome is restrained: Blue pagination, Navy fullscreen overlay, White image frame, no decorative gradient, and no placeholder when a path has no slides. The image assets themselves are not brand compliant; see Slide Compliance Findings.

### Empty and No-Result States

White surfaces, Teal icons, Navy copy, and Blue actions are compliant. The no-result accent uses Persimmon/Orange and is not compliant.

### Metadata

The title and manifest name clearly identify Career Paths. The description is clear, non-exaggerated, and decision-oriented. It does not contain prohibited promises. It does not express the experience-led core message, however, and focuses only on viewing, saving, and comparing paths.

## Color Compliance Findings

### Passing evidence

- Main interactive CTAs use UA Blue, including back, show-more, no-result, saved-empty, compare, and active compare controls.
- Major headings and primary copy inherit UA Navy.
- Page and card surfaces are White or `#F8FAFC`.
- Teal is used for several icons, empty-state cues, related-path emphasis, and the bottom-navigation active indicator.
- No gradient was found in the Career CSS, so no invalid gradient direction exists.

### Failing evidence

- `CareerPages.module.css:5-6` defines Yellow `#FFC801` and Persimmon `#F86E4B` as Career tokens.
- Yellow appears in the hero highlight, stepper, domain icons, item counts, seniority highlight, technical-skill emphasis, job-description rule, related label, and search-result reason.
- Persimmon/Orange appears in reset, management badge, saved state, essential soft skill, soft tags, and no-result accent.
- `CareerShell.module.css:41` uses Yellow for the header product marker.
- `#0974C5` appears as a separate connection/tool blue outside the supplied locked audit palette.

Result: **Fail**. The application chrome contains multiple explicit forbidden colors.

## Messaging Compliance Findings

The interface is generally clear, human, and oriented toward comparing and reviewing career paths. It avoids guarantees and does not promise hiring, rapid success, transformation, or certainty. Compare, Saved Paths, and most detail labels are appropriately practical.

The main hero says that tens of thousands of job advertisements were reviewed. That is useful evidence, but without an experience-led statement it positions the product closer to a structured job-market index than Useravaa's core promise of real experience for better decisions. Metadata has the same omission.

Several slide phrases are promotional or motivational rather than restrained decision support, including claims such as a path being highly suitable, attractive, enjoyable, having good income, or producing visible impact. The slides also use simplified personality-fit checklists that can imply more certainty than the underlying product should claim.

Result: **Partial fail**. No prohibited absolute promise was found, but the core brand message is underrepresented and slide language is too promotional.

## Mascot Compliance Findings

The standalone mascot asset is technically polished, transparent, and mainly Blue/Teal/Navy. Its magnifier supports discovery conceptually.

Its glossy 3D cartoon treatment, large expressive eyes, smirk, hoodie, sneakers, repeated emotional poses, and frequent thumbs-up/heart/trophy associations make it feel playful and gamified rather than professional and minimal. Repetition throughout both slide sets amplifies the child-oriented tone.

Result: **Fail for current launch usage**. The concept may remain usable after a stricter usage system, but the present treatment is not defensible as restrained Useravaa brand expression.

## Slide Compliance Findings

All ten slides use the correct portrait format and are legible. They have coherent series structure and use Navy, Blue, Teal, and White prominently.

Both series also contain extensive Yellow/Gold, Orange, decorative Red/Pink, Purple, and off-brand Green. They use hearts, trophies, stars, emojis, colored app-like icons, cartoon poses, and dense promotional infographic layouts. The UI/UX series is especially multi-colored and includes motivational framing such as suitability, attraction, enjoyment, income, and impact. The content-marketing series is somewhat more restrained but still contains prohibited accent colors and generic social-ad visual language.

Result: **Fail**. The carousel container is compliant; the committed slide artwork is not.

## CTA / Label Compliance Findings

- Primary CTAs: pass; UA Blue with White text.
- Informational/positive structural cues: mostly pass where Teal is used.
- Saved active state and reset action: fail due to Persimmon/Orange.
- Search, hierarchy, compare, and saved labels: clear and human.
- No mentoring, booking, payment, advisor, marketplace, chat, or education CTA is exposed in the Career navigation.
- No exaggerated outcome CTA was found.

## Mobile Visual QA

A fresh 390x844 browser pass could not be completed. The supported in-app browser recovery flow was attempted, but it reported no connected tabs even though the desktop app displayed a local tab. No alternate browser was used.

Prior launch QA recorded no page-level horizontal overflow and successful mobile behavior, but that evidence is not treated as a fresh brand-visual sign-off. Source review confirms responsive breakpoints and overflow containment remain present. Fresh mobile screenshots and computed-style checks are still required after brand fixes.

Console warnings/errors, `/career` redirect, Saved Paths, Compare, detail with slides, and detail without slides could not be freshly re-verified in the browser during this audit. Focused tests and production build cover the route/component contracts but do not replace rendered visual QA.

## Validation Results

- `git status --short`: clean before this report was created.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run tests/career-mvp-shell.test.tsx`: passed, 43 of 43 tests.
- `npm run build`: passed.
- `git diff --check`: passed.
- Fresh in-app browser QA: unavailable because no tab was connected to the browser-control surface.

## Issues Found

1. Forbidden Yellow and Persimmon/Orange remain throughout the Career application chrome.
2. All ten committed slide images contain prohibited colors and generic promotional/infographic clutter.
3. Mascot usage is too cartoon-like, emotional, and repeated to feel professional and minimal.
4. Hero and metadata messaging omit the core experience-led brand proposition and lead with job-ad analysis.
5. Some slide copy is motivational/promotional and overstates fit or attractiveness.
6. Connection Blue `#0974C5` is used despite not appearing in the locked palette for this audit.
7. Fresh rendered mobile, redirect, state, overflow, and console QA remains incomplete because the in-app browser was disconnected.

## Severity Ranking

### High

- Application-chrome palette violations: Yellow and Persimmon/Orange.
- Slide artwork palette and visual-language violations.
- Mascot treatment and repetition create a child-oriented/gamified impression.

### Medium

- Experience-led core message is absent from hero and metadata.
- Promotional/suitability language in slide content.
- Unapproved Connection Blue usage.
- Fresh browser/mobile brand evidence is incomplete.

### Low

- None identified that should distract from the launch-blocking items above.

## Recommended Fix Plan

1. Replace every Yellow/Persimmon application token and state with UA Teal, UA Blue, Navy, White, or approved light neutral according to semantic role. Keep primary actions Blue and highlights Teal.
2. Remove Connection Blue from launch UI or obtain explicit brand approval for a narrowly defined data-only role.
3. Temporarily unlist the current slides or replace them with brand-compliant artwork using only Navy, Blue, Teal, White, and approved light backgrounds. Remove hearts, trophies, stars, emoji styling, rainbow icon colors, and promotional-template composition.
4. Define a mascot usage standard before launch: smaller scale, fewer appearances, neutral expression, no hoodie/sneakers/emotional pose system, and no repeated mascot on every slide. If that cannot be achieved quickly, remove mascot from the launch surface.
5. Revise hero and metadata messaging to lead with real experience and better decisions, while retaining the job-ad analysis only as supporting evidence.
6. Rewrite slide copy as neutral decision support: responsibilities, realities, tradeoffs, fit signals, and uncertainty. Remove attractiveness, income, enjoyment, and simplified personality-fit claims unless directly evidenced.
7. After fixes, run a fresh desktop and 390x844 browser review covering root, redirect, Saved Paths, Compare, detail with/without slides, empty states, console, and horizontal overflow.

## Go/No-Go For Moving To PWA Readiness

**No-Go.** The implementation is technically healthy and the product scope/navigation are correctly constrained, but the committed visual system and slide assets conflict directly with the locked brand palette and tone. High-severity palette, slide, and mascot issues must be resolved before PWA Readiness. Fresh rendered mobile/browser QA must then be completed.
