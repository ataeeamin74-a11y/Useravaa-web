# Codex Instructions

Apply this patch before implementing or finalizing Experience Question Engine.

Priority:
1. Structured timeline is the source of truth for current/previous role, seniority, company, company field, and country.
2. Do not rely on comma-separated previousCompanies for question eligibility.
3. Update `/profile/build` to include `سوابق تجربه`.
4. Update Experience Question Engine field mapping to derive current/previous values from timeline.
5. Keep no-admin rule unchanged:
   - Provider self-publishes
   - no Admin review
   - answer statuses: draft, published, retracted

Verification:
- npm run lint
- npm run typecheck
- npm run test
- npm run build

Create report:
`PHASE_EQE_TIMELINE_PATCH_REPORT.md`
