# Deployment Checklist

1. Install dependencies.
2. Validate environment variables.
3. Run lint.
4. Run typecheck.
5. Run unit tests.
6. Run state machine transition tests.
7. Build frontend.
8. Generate Prisma client.
9. Run database migrations.
10. Seed development/staging data.
11. Deploy preview environment.
12. Run smoke tests:
    - /discover loads
    - /guide loads
    - auth flow works
    - /profile loads for authenticated user
    - profile build form validates
    - conversation request can be created
    - time proposal validates 3..6 options
    - checkout creates payment state
    - wallet page loads
    - settlement form validates IBAN
13. Run E2E scenarios from `12_TEST_CASES/e2e-scenarios.csv`.
14. Verify production config:
    - database
    - auth secrets
    - upload storage
    - payment provider
    - notification provider
    - logging/monitoring
15. Product approval for release.
16. Deploy production.
17. Monitor error logs and payment webhooks.
18. Rollback plan:
    - keep previous build artifact
    - database rollback strategy documented before migration
    - disable payment finalization if webhook errors appear
