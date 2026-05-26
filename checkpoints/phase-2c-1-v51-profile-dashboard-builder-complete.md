# phase-2c-1-v51-profile-dashboard-builder-complete

Checkpoint for the approved Phase 2C-1 V51 profile dashboard and profile builder work.

## Included Scope

- `/profile` implemented with V51 profile dashboard structure, Persian copy, RTL behavior, and fixture-only profile state.
- `/profile/build` implemented with V51 profile builder structure, Persian copy, RTL behavior, and mock-only builder state.
- Profile dashboard fixture data is included in `src/features/v51/data/my-profile.ts`.
- Profile builder fixture/mock state is included in `src/features/v51/data/my-profile.ts`.
- Local avatar upload/replace/remove behavior is implemented without any real upload provider.
- Category chips, company tag add/remove behavior, company suggestions, and language chips are implemented with local state.
- Organization-level pricing caps are implemented as typed fixture rules.
- Free-help behavior is implemented:
  - prices become `0`
  - price inputs become disabled
  - preview displays `رایگان`
  - previous paid values restore within caps when free help is disabled
- Draft save behavior is implemented as local mock state.
- Preview modal open/close behavior is implemented as local mock state.
- Submit-for-review behavior is implemented as local mock state and moves valid drafts to `pending_review`.
- Profile dashboard mock status actions are included:
  - `active -> inactive` for temporary deactivation
  - `inactive -> pending_review` for reactivation, following the handoff state machine
- `V51 Profile Interaction Audit` is included in `PHASE_2C_1_REPORT.md`.
- Prototype reference files are preserved unchanged:
  - `prototype/index.html`
  - `prototype/styles.css`
  - `prototype/script.js`
- `PHASE_2C_1_REPORT.md` is included.

## Verification

The following checks passed for the Phase 2C-1 checkpoint:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
  - 3 test files passed
  - 24 tests passed
- `npm run build`

## Git Status

An actual Git commit could not be created in this environment because:

- No `.git/` directory exists in the workspace.
- `git` is not available on PATH.

This file is the named checkpoint artifact for `phase-2c-1-v51-profile-dashboard-builder-complete`.
