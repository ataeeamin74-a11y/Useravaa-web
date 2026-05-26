# useravaa-execution-handoff-v1

This package is an execution handoff for converting the latest Useravaa prototype in this conversation into a production-ready web app.

## Source of truth order

1. Final product decisions made in this conversation.
2. Latest prototype file included in this package: `prototype/index.html`.
3. Earlier prototype behavior only when not contradicted by later decisions in this conversation.

## Production instruction for Codex

Use the files in this package as implementation contracts:

- `09_BUSINESS_RULES/` for business logic.
- `05_STATE_MACHINES/` for allowed transitions and invalid transition handling.
- `06_DATA_MODEL/` for persistence models.
- `07_API_CONTRACTS/` for backend contract.
- `08_FRONTEND_CONTRACTS/` for frontend page/component/form implementation.
- `12_TEST_CASES/` for acceptance and E2E verification.
- `14_KNOWN_GAPS.md` for unresolved items that must not be guessed.

## Prototype status

`prototype/index.html`, `prototype/styles.css`, and `prototype/script.js` are visual/product references only.

They are not production code. They include prototype-only state, mock data, inline behavior and legacy fragments. Do not copy the prototype as the production architecture. Use it for UI/product reference and rebuild with typed components, API data, validation, state machines and tests.

## Scope control

No feature, pricing, workflow, role, copy, API or data field should be added unless it appears in this package or is explicitly listed as a known gap requiring product decision.
