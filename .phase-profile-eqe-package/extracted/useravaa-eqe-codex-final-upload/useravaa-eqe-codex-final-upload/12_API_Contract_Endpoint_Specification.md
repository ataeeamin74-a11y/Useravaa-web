# API Contract / Endpoint Specification

## GET /api/experience-questions/me/current
Auth: Provider
Returns active weekly question.

## POST /api/experience-questions/{questionId}/replace
Auth: Provider
Replaces current active question.

## POST /api/experience-questions/{questionId}/skip
Auth: Provider
Marks question as skipped.

## POST /api/experience-questions/{questionId}/answers/draft
Auth: Provider
Creates or updates draft answer.
Body: { "answerText": "string" }

## POST /api/experience-answers/{answerId}/publish
Auth: Provider
Publishes answer directly after responsibility confirmation.
Body: { "responsibilityAccepted": true }
Response: { "answerId": "string", "status": "published", "publishedAt": "datetime" }

## POST /api/experience-answers/{answerId}/retract
Auth: Provider
Removes own published answer from profile.
Response: { "answerId": "string", "status": "retracted" }

## GET /api/profiles/{profileId}
Adds `experienceAnswers`, only published, max 3, sorted by publishedAt desc.

## Explicitly Not Implemented
- Admin review endpoints
- approve endpoint
- reject endpoint
- hide endpoint
