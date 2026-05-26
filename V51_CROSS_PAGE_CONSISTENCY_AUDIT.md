# V51 Cross-Page Consistency Audit

## 1. Scope

This audit checks cross-page consistency across the currently implemented V51 production routes. It is not a redesign pass and does not modify the approved prototype files.

Routes audited:

- `/discover`
- `/insights`
- `/guide`
- `/profiles/[profileId]`
- `/requests/new`
- `/conversations`
- `/conversations/[conversationId]`
- `/conversations/[conversationId]/propose-times`
- `/conversations/[conversationId]/select-time`
- `/checkout/[conversationId]`
- `/profile`
- `/profile/build`
- `/profile/network`
- `/profile/feedback`
- `/profile/settings`
- `/wallet`
- `/notifications`

References checked:

- `prototype/index.html`
- `prototype/styles.css`
- `prototype/script.js`
- `src/lib/routes.ts`
- `src/components/header/Header.tsx`
- `src/components/header/Header.module.css`
- `src/features/v51/components/V51Button.tsx`
- `src/features/v51/components/V51Button.module.css`
- V51 route, feature, and CSS Module files under `src/features/v51/`
- Existing phase reports and test coverage

## 2. Audit Method

- Checked all route registrations and active-route grouping in `src/lib/routes.ts`.
- Checked shared app shell and header behavior against the V51 navigation hierarchy.
- Checked page-level hierarchy, CTA placement, and return/navigation patterns across profile, conversation, wallet, notification, discovery, insight, and guide surfaces.
- Checked shared button, select, modal, card, status, empty, error, and success-message treatment through the route components and CSS Modules.
- Checked implemented route availability through production `next build`.
- Ran lint, typecheck, test, and production build verification through the bundled Node runtime.

## 3. Consistency Results

| Area | Result | Notes |
| --- | --- | --- |
| Route map | Pass | All 17 current routes are represented in `appRoutes`, with dynamic route IDs resolved for profiles, conversations, checkout, and request creation. |
| Header and navigation | Pass | Top-level navigation preserves the V51 grouping: Discover, Insights, Conversations, Profile, plus Guide, Notifications, and Wallet utilities. Profile subpages remain grouped under Profile rather than top-level nav. |
| Active navigation state | Pass | Dynamic profile, request, conversation, checkout, profile subpage, wallet, notification, guide, discover, and insights paths resolve to stable route IDs. |
| Shared V51 buttons | Pass | Shared `V51Button` and `V51LinkButton` keep the V51 tones, disabled state, full-width option, and compact overrides where route-specific V51 sizing requires it. |
| RTL shell | Pass | Global route surfaces use RTL layout assumptions and scoped CSS Modules. LTR-only account, phone, email, and IBAN values explicitly opt into `dir="ltr"` where needed. |
| Discover and Insights | Pass with intentional product delta | Discover and Insights share the same V51 visual language, card density, white surfaces, teal/blue/navy palette, and profile-entry semantics. Insights intentionally follows the later editorial refinement rather than the original prototype flow. |
| Profile detail and request flow | Pass | Public profile CTAs route into request creation consistently, request duration/pricing behavior remains fixture-driven, and request panels preserve the V51 state hierarchy. |
| Conversation cluster | Pass | List, detail, propose-times, select-time, checkout, expiration, payment-gating, and similar-experience states use consistent status-driven actions and compact V51 action rows. |
| Profile dashboard cluster | Pass | `/profile`, `/profile/build`, `/profile/network`, `/profile/feedback`, and `/profile/settings` share the same CSS Module family, panel shape, card density, back-link pattern, modal style, and local fixture state approach. |
| Wallet and settlement | Pass | Wallet and profile settings share the same settlement validation helpers and settlement modal component, keeping IBAN formatting, validation, and save/error messages consistent. |
| Notifications | Pass | Notifications route into the related profile/question/conversation paths and uses the same V51 card and primary CTA language as the surrounding account utilities. |
| Empty/error/success states | Pass | Implemented empty, error, validation, saved, and success states use route-local copy but the same V51 bordered panel/card/message conventions. |
| Prototype preservation | Pass | Prototype reference files remain audit inputs only; no prototype file changes are part of this audit. |

## 4. Issues Found

No blocking cross-page consistency issue was found in the implemented route set.

No code changes were made as part of this audit.

## 5. Intentional Differences

- `/insights` follows the later insight-page refinement and is no longer the original first-screen intent-card flow. It still preserves the V51 route shell, palette, card surface, RTL structure, and profile-entry behavior.
- Production uses route-based Next.js pages instead of the prototype single-page `data-nav` section switching.
- Real provider/API integration remains deferred. Fixture and local state behavior is consistent across pages, but persistence and cross-session state are intentionally not implemented.
- Pixel-level browser comparison was not repeated in this audit. This pass focuses on cross-page interaction, route, shared component, state, and layout consistency.

## 6. Residual Risks

- Browser-native controls can render slightly differently across operating systems, especially select controls. Implemented V51 select wrappers keep caret placement consistent where custom treatment exists.
- Without screenshot automation in this environment, this audit cannot certify exact rendered line breaks or pixel parity across every breakpoint.
- Some route metadata and test output display as mojibake in this PowerShell environment, but existing tests continue to assert the stored route labels and production build succeeds.

## 7. Verification Results

`npm` and `git` are not available on this shell PATH, so verification used the bundled Node runtime directly.

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` - passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` - passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` - passed, 10 files / 121 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` - passed

## 8. Conclusion

The V51 cross-page consistency audit is complete. The current implemented route set is consistent across route mapping, navigation grouping, active states, shared V51 controls, RTL layout conventions, page/card density, profile-adjacent flows, conversation/payment state flows, wallet/settlement behavior, notifications, and fixture-only state boundaries.

## 9. Implemented Fixes

### Files Changed

- `src/app/saved/page.tsx`
- `src/lib/routes.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/data/my-profile.ts`
- `src/features/v51/saved/SavedPage.tsx`
- `src/features/v51/saved/SavedPage.module.css`
- `src/features/v51/saved/useSavedItems.ts`
- `src/features/v51/my-profile/pages/ProfileNetworkPage.tsx`
- `src/features/v51/my-profile/pages/ProfileSettingsPage.tsx`
- `src/features/v51/my-profile/components/NetworkProfileCard.tsx`
- `src/features/v51/my-profile/components/ProfileDashboardPanels.tsx`
- `src/features/v51/conversations/pages/ConversationDetailPage.tsx`
- `src/features/v51/conversations/components/ConversationStatusGroup.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/manual-ui-fix.test.tsx`
- `tests/phase-2c-1.test.tsx`
- `tests/phase-2c-2.test.tsx`
- `tests/route-map.test.ts`
- `PHASE_EXPERIENCE_DISCOVERY_SYSTEM_REPORT.md`
- `V51_CROSS_PAGE_CONSISTENCY_AUDIT.md`

### Follow Removal Result

- Removed user-facing Follow, Followers, Following, فالو, دنبال, and دنبال‌کننده language from implemented MVP UI surfaces.
- Public profiles do not render follow/follower/following controls or counts.
- Profile dashboard and profile network now frame saved profiles as saved items only.
- Profile settings no longer exposes follower-count privacy controls.
- Conversation helper copy no longer uses دنبال wording.

### Save Destination Implementation

- Added `/saved` as a first-class route and account utility destination.
- Added shared local saved-state helpers backed by browser `localStorage` for:
  - saved experience profile IDs
  - saved insight IDs
- Discover save buttons now show `ذخیره‌شده` after saving.
- Insight save buttons now show `ذخیره‌شده` after saving.
- Save feedback now explains that saved items are available in `ذخیره‌شده‌ها`.

### `/saved` Behavior

- `/saved` shows saved experiences from the V51 profile fixtures.
- `/saved` shows saved insights from published insight fixtures.
- `/saved` filters out draft and retracted insights even if their IDs are present in saved local state.
- `/saved` empty state says exactly: `هنوز چیزی ذخیره نکرده‌اید.`
- Saved items can be removed locally from `/saved`.

### Insight Visibility Mapping

- Published insights appear in `/insights`.
- Published insights appear in the author public profile through `ProfileInsightsSection`.
- Draft insights do not appear publicly.
- Retracted insights do not appear publicly.
- Tests now seed draft and retracted insight fixtures and verify they stay hidden from public surfaces.

### Naming Update To `بینش‌ها`

- User-facing `/insights` page name is now `بینش‌ها`.
- Header navigation label is now `بینش‌ها`.
- Route metadata title is now `بینش‌ها`.
- Download/share preview branding is now `Useravaa · بینش‌ها`.
- Route remains `/insights`.
- `/insights` remains theme-first, equal-card, no featured person, no hero provider.
- `/discover` remains search-first and profile-driven.
- Request conversation is still absent from `/discover` and `/insights` cards.

### Tests Added/Updated

- Updated route-map tests for 18 routes and `/saved`.
- Updated Discover tests for visible saved state and no request conversation/social follow UI.
- Updated Insights tests for `بینش‌ها`, visible saved state, hidden draft/retracted insights, and card restrictions.
- Added `/saved` tests for saved experiences, saved insights, hidden non-public insights, and exact empty-state copy.
- Updated profile dashboard/network tests to remove follow/follower expectations.
- Updated manual UI fix tests for saved state labeling.

### Verification Results After Fixes

`npm` is not available on this shell PATH:

- `npm --version` failed with `The term 'npm' is not recognized`.

Bundled Node equivalents were run:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` - passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` - passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` - passed, 10 files / 122 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` - passed, including `/saved`
