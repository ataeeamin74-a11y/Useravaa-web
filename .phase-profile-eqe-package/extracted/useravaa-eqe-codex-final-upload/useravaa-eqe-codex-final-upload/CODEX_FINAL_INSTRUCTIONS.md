# Codex Final Instructions — Useravaa Experience Question Engine

Use this package as the final source of truth for implementing the Experience Question Engine.

## Final Product Decision

This feature is a **Profile Enrichment Mechanism**, not a social feature.

It must enrich Provider profiles with short, professional, experience-based answers.

## Absolute Rules

1. Do not create Admin review flow.
2. Do not create Admin approval.
3. Do not create Admin rejection.
4. Do not create Admin hide/moderation workflow for this feature.
5. Provider is responsible for the answer content.
6. Provider publishes directly after accepting responsibility.
7. Answer statuses are only:
   - draft
   - published
   - retracted
8. Do not implement:
   - pending_review
   - rejected
   - hidden
9. Do not create social features:
   - feed
   - post
   - like
   - comment
   - share
   - public activity
   - social graph
   - ranking
   - public answer page

## Final Placement Rules

### Provider Side

Raw weekly question must appear only for the Provider, inside their own profile/account area.

Route:

```text
/profile
```

Placement:

```text
Profile page
→ after profile status / profile hero
→ before performance, feedback, network, wallet/account/settings sections
→ component: WeeklyQuestionCard
→ anchor id: weekly-question
```

Requester must never see raw unanswered questions.

### Public Profile Side

Requester only sees published question-answer pairs.

Route:

```text
/profiles/[profileId]
```

Placement:

```text
Public Provider profile
→ section title: از تجربه من
→ component: ProfileExperienceAnswersSection
```

Display rules:

- Show only answers with status `published`.
- Each item includes:
  - rendered question
  - Provider answer
- Max 3 items.
- Sort by `publishedAt desc`.
- If there are no published answers, do not render the section.
- No like/comment/share/save-on-answer.
- No answer detail page.

### Notifications

Notifications are reminders only.

Notification copy:

```text
پرسش این هفته آماده است
```

Target:

```text
/profile#weekly-question
```

Rules:

- Do not show full question text inside notification.
- Do not create social notification.
- Do not notify followers/requesters when Provider publishes an answer.

## Required Components

Implement or update:

- WeeklyQuestionCard
- AnswerEditor
- ResponsibilityCheckbox
- ProfileExperienceAnswersSection
- ExperienceAnswerItem
- RetractAnswerButton

## Provider Flow

1. Provider opens `/profile`.
2. WeeklyQuestionCard appears if there is an active weekly question.
3. Provider can:
   - پاسخ می‌دهم
   - سؤال دیگری بده
   - فعلاً نه
4. Provider writes answer.
5. Provider must check responsibility confirmation.
6. Provider clicks:
   - انتشار در پروفایل
7. Answer becomes `published`.
8. Published answer appears in `/profiles/[profileId]` under `از تجربه من`.
9. Provider can retract own published answer.
10. Retracted answer disappears from public profile.

## Copy Must Stay Exactly

Card title:

```text
پرسش این هفته
```

Card description:

```text
پاسخ کوتاه شما به کامل‌تر شدن پروفایل تجربه‌تان کمک می‌کند.
```

Actions:

```text
پاسخ می‌دهم
سؤال دیگری بده
فعلاً نه
```

Answer helper:

```text
۳ تا ۵ جمله کافی است. پاسخ را بر اساس تجربه شخصی خودتان، حرفه‌ای و بدون افشای اطلاعات محرمانه بنویسید.
```

Safety text:

```text
پاسخ را حرفه‌ای، محترمانه و بدون افشای اطلاعات محرمانه بنویسید. هدف، توضیح تجربه شخصی شماست، نه ارزیابی یا تخریب شرکت‌ها.
```

Responsibility checkbox:

```text
مسئولیت محتوای این پاسخ با من است.
```

Publish CTA:

```text
انتشار در پروفایل
```

Public section title:

```text
از تجربه من
```

Retract CTA:

```text
حذف از پروفایل
```

## Required API Behavior

Provider APIs:

- `GET /api/experience-questions/me/current`
- `POST /api/experience-questions/{questionId}/replace`
- `POST /api/experience-questions/{questionId}/skip`
- `POST /api/experience-questions/{questionId}/answers/draft`
- `POST /api/experience-answers/{answerId}/publish`
- `POST /api/experience-answers/{answerId}/retract`

Public profile API:

- `GET /api/profiles/{profileId}` must include max 3 published experience answers.

Do not implement Admin endpoints for this feature.

## Required Tests

Add tests for:

1. WeeklyQuestionCard renders on `/profile` for Provider.
2. Raw question does not render on `/profiles/[profileId]`.
3. Published answers render inside `از تجربه من` on `/profiles/[profileId]`.
4. `از تجربه من` is hidden when there are no published answers.
5. Max 3 published answers render.
6. Notification links to `/profile#weekly-question`.
7. Notification does not include full question text.
8. Publish is blocked without responsibility checkbox.
9. Publishing valid answer changes status from `draft` to `published`.
10. Provider can retract own published answer.
11. Retracted answer disappears from public profile.
12. No Admin routes, states, or components are added.

## Verification Required

Before reporting completion, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Deliverable Required

Create:

```text
PHASE_EQE_REPORT.md
```

Report must include:

- routes touched
- components added
- fixture data added
- API mocks or contract changes
- answer statuses implemented
- no-admin confirmation
- placement rules implemented
- tests added
- verification results
- known gaps deferred
