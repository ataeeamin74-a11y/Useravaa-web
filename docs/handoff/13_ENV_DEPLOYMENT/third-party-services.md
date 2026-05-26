# Third-party Services

Only service categories required by the current product scope are listed. Specific providers were not selected in this conversation.

## Required categories

- Database provider
  - Needed for user accounts, profiles, conversations, wallet, settlement info and feedback.

- Authentication/session provider
  - Needed for authenticated routes and permission enforcement.

- Object/file storage
  - Needed for profile image upload.

- Payment provider
  - Needed for checkout, top-up and payment confirmation.

- Notification delivery provider
  - Needed for notification center integration and optional email/SMS delivery.

- Monitoring/logging provider
  - Needed for deployment observability.

## Optional / not selected

- SMS provider for phone verification.
- Email provider for transactional notifications.
- Error monitoring provider.

Provider selection is a known gap and must be decided before production deployment.
