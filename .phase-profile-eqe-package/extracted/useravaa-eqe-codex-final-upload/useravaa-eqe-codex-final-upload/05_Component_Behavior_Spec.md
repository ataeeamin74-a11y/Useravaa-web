# Component Behavior Spec

## WeeklyQuestionCard
Props: questionId, renderedQuestion, canReplace, status
Events: onAnswerStart, onReplace, onSkip
States: active, replaceUnavailable, skipped, loading, error

## AnswerEditor
Props: question, draftAnswer, maxLength=700, responsibilityAccepted
Events: onSaveDraft, onPublish, onCancel
States: draft, invalid, readyToPublish, publishing, published
Validation: required answer, max 700 chars, responsibility confirmation required

## ProfileExperienceAnswersSection
Props: answers[], maxItems=3
Behavior: hidden if answers.length === 0; no social actions

## RetractAnswerAction
Props: answerId, ownerId
Events: onRetract
Permission: Provider owner only
