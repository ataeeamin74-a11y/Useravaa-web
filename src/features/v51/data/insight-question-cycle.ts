export const currentInsightQuestionCycle = {
  id: "insight-cycle-current",
  label: "سؤال این دوره",
  questionText: "در نقش شما، چه چیزی از بیرون ساده به نظر می‌رسد اما در عمل سخت‌ترین بخش کار است؟",
  startsAt: "2026-05-20T00:00:00.000Z",
  endsAt: "2026-05-23T00:00:00.000Z",
  answerCount: 12,
  cadenceText: "هر ۳ روز یک سؤال تازه از بانک سؤال‌های Useravaa نمایش داده می‌شود.",
  nextQuestionLabel: "سؤال بعدی تا ۳ روز دیگر"
} as const;

export type InsightQuestionCycle = typeof currentInsightQuestionCycle;

export const insightQuestionBank = [currentInsightQuestionCycle] as const;

export function getCurrentInsightQuestionCycle() {
  return currentInsightQuestionCycle;
}

export function getCurrentInsightQuestionText() {
  return currentInsightQuestionCycle.questionText;
}
