# Useravaa Phase 15 Brand Compliance Re-QA v1

## Result

**PASS**

Phase 15 commit `d7210545f708c1e4838e0d58c9bb5d4c1bd79f2e` passes the requested brand, clickability, responsive, and validation checks. No blocking issue remains within the Phase 15 scope.

## Task Scope

This re-QA reviewed the committed Career PWA hero, discovery copy, mascot behavior, domain accent system, card metadata, hidden slide state, native card controls, desktop rendering, mobile rendering, and the focused automated test coverage. No application behavior or source data was changed during this audit.

## Commit Under Review

- Commit: `d7210545f708c1e4838e0d58c9bb5d4c1bd79f2e`
- Message: `fix: stabilize career visuals and clickability`
- Latest commit check: PASS

## Approved Copy Verification

All required copy remains present verbatim in the committed `PathsPage.tsx` and rendered root page.

Hero title:

> مسیر مناسب خودت را  
> قدم‌به‌قدم پیدا کن

Hero supporting copy:

> ده‌ها هزار آگهی شغلی بررسی شده تا تو مسیرها را روشن‌تر ببینی و مسیر شغلی بهتری انتخاب کنی.

Domain section title:

> حوزه‌ای که کنجکاوت می‌کند

Domain section supporting copy:

> یکی از ۱۰ حوزه واقعی را انتخاب کن تا دسته‌های داخلش را ببینی.

Result: PASS.

## Mascot Verification

- Desktop: visible at approximately `168px` width.
- Mobile: visible at `78px` width.
- Computed `pointer-events`: `none` at both sizes.
- The mascot does not enter the interactive click layer.
- Desktop and mobile screenshots showed the mascot alongside the approved hero content.

Result: PASS.

## Domain Accent Verification

Rendered domain icon accents use the approved discovery palette:

- UA Blue: `#245FFD`
- UA Teal: `#01C3B9`
- Insight Yellow: `#FFC801`
- Persimmon: `#F86E4B`
- Connection Blue: `#0974C5`, declared as the approved local token `--career-connection-blue`

Computed-style inspection confirmed:

- Persimmon icons use white foreground content: `rgb(255, 255, 255)`.
- The `ارتباط با مشتری` card uses Teal, not the rejected blue accent.
- Yellow and Teal use the approved Navy foreground treatment.
- All ten domain cards are native `BUTTON` elements with `pointer-events: auto`.

Result: PASS.

## Card Metadata Verification

- Top-level domain count labels use `مسیر شغلی`.
- Category count labels use `مسیر شغلی`.
- Count metadata does not append or expose `دسته`.
- Focused tests explicitly assert that count labels do not contain `دسته` and do not fall back to `مسیر` alone.

Result: PASS.

## Slide Exposure Verification

- The committed `career-slide-manifest.ts` exports an empty manifest.
- `getCareerSlides()` therefore returns no approved entries for every path.
- Desktop detail inspection found zero career slide images and zero carousel/slide sections.
- Mobile root inspection also found zero career slide images.
- No empty carousel, broken image, or placeholder slide UI was rendered.

Result: PASS.

## Interaction Verification

Focused test coverage includes:

- full native domain-card controls;
- icon, title, whitespace, and arrow remaining inside each clickable domain button;
- native category and path controls;
- customer-domain accent correction;
- mascot visibility and decorative-layer pointer behavior;
- unapproved slide hiding.

Browser interaction evidence:

- Desktop domain selection advanced from the domain grid to the path-selection state. Marketing has one meaningful intermediate category, so the existing hierarchy compression correctly advances to its path list.
- Desktop path selection opened a detail view successfully.
- Mobile domain selection advanced to path selection and exposed the expected back control.
- No relevant console warning or error was captured.

Result: PASS.

## Responsive Browser QA

### Desktop

- Viewport override: `1280 × 800`.
- Root Career PWA rendered with the approved hero, mascot, stepper, domain section, varied accents, and three-item Career navigation.
- Mascot width: approximately `168px`.
- Horizontal page overflow: none.
- Console warnings/errors: none.

### Mobile

- Viewport override: `390 × 844`; browser content width measured `375px` after browser scrollbar/chrome allocation.
- Approved hero and mascot remained visible.
- Mascot width: `78px`.
- Ten native domain cards rendered.
- Domain click-through worked.
- Horizontal page overflow: none.
- Console warnings/errors: none.

Result: PASS.

## Validation Results

| Check | Result |
| --- | --- |
| `git status --short` | PASS; only expected pre-existing unstaged items were present before this report |
| `git log -1 --oneline` | PASS; `d721054 fix: stabilize career visuals and clickability` |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test -- --run tests/career-mvp-shell.test.tsx` | PASS; 1 file, 49 tests |
| `npm run build` | PASS |
| `git diff --check` | PASS |

PowerShell's execution policy blocks the `npm.ps1` shim on this machine, so the same package scripts were invoked through `npm.cmd`. This does not change the scripts or their results.

## Raw Data Verification

- The Phase 15 commit contains no `.json` file changes.
- The current unstaged diff contains no raw JSON changes.
- No career dataset was edited, reformatted, regenerated, or staged.

Result: PASS.

## Working Tree Baseline

Before creating this requested report, `git status --short` contained only:

- modified `public/site.webmanifest`;
- modified `src/app/page.tsx`;
- untracked `public/career-slides/تحقیقات-بازار-و-بینش-بازار/` folder.

These items were not changed, staged, or committed during re-QA. This report is now an additional untracked file by design.

## Remaining Non-Blocking Issues

1. `public/site.webmanifest` and `src/app/page.tsx` remain unstaged, as expected. They are outside the Phase 15 commit and should receive their own disposition before a later clean-tree release gate.
2. The untracked slide folder remains intentionally untouched. Because the committed manifest is empty, it cannot expose non-compliant artwork in the launch UI.
3. The in-app browser's `390px` viewport override produced a `375px` document client width after browser scrollbar/chrome allocation. The layout still passed the mobile breakpoint and overflow checks.

## Final Decision

Phase 15 Brand Compliance Re-QA is **PASS**. The committed Career PWA preserves the approved copy and palette, keeps the mascot visible without blocking interaction, renders correct count metadata, hides non-compliant slides, and retains native clickable discovery controls on desktop and mobile.
