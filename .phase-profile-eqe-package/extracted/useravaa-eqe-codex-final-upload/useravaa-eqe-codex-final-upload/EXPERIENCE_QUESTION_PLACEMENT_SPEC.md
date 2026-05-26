# Experience Question Placement Spec

## Purpose

Define exactly where Experience Question Engine surfaces appear in Useravaa.

## Raw Question Visibility

```json
{
  "provider": true,
  "requester": false,
  "admin": false
}
```

## Raw Question Placement

```json
{
  "route": "/profile",
  "anchorId": "weekly-question",
  "component": "WeeklyQuestionCard",
  "placement": "after_profile_status_before_dashboard_sections"
}
```

## Public Answer Placement

```json
{
  "route": "/profiles/[profileId]",
  "sectionTitle": "از تجربه من",
  "component": "ProfileExperienceAnswersSection",
  "maxItems": 3,
  "sort": "publishedAt desc",
  "showOnlyStatus": "published",
  "hideWhenEmpty": true
}
```

## Notification Placement

```json
{
  "showFullQuestion": false,
  "copy": "پرسش این هفته آماده است",
  "target": "/profile#weekly-question"
}
```

## Forbidden Routes

Do not create:

```text
/questions
/experience-answers
/feed
/posts
/activity
/community
/admin/experience-answers
/admin/experience-answers/[answerId]
```

## Forbidden UI Surfaces

Do not show raw questions in:

- discover cards
- public profile
- guide page
- conversations
- wallet
- notification body
- any feed-like page

## Required UI Surfaces

Show raw question only in:

```text
/profile#weekly-question
```

Show published Q/A only in:

```text
/profiles/[profileId] → از تجربه من
```
