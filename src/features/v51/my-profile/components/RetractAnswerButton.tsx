import { V51Button } from "@/features/v51/components/V51Button";
import { weeklyQuestionCopy } from "@/features/v51/data/experience-questions";

type RetractAnswerButtonProps = Readonly<{
  onRetract: () => void;
}>;

export function RetractAnswerButton({ onRetract }: RetractAnswerButtonProps) {
  return (
    <V51Button type="button" tone="danger" onClick={onRetract}>
      {weeklyQuestionCopy.retractAction}
    </V51Button>
  );
}
