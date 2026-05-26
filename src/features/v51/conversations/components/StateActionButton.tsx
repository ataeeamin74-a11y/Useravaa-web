import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import type { ConversationAction } from "@/features/v51/data/conversations";

type StateActionButtonProps = {
  action: ConversationAction;
  onAction?: (action: ConversationAction) => void;
};

export function StateActionButton({ action, onAction }: StateActionButtonProps) {
  if (action.href && action.kind !== "cancel") {
    return (
      <V51LinkButton href={action.href} tone={action.tone}>
        {action.label}
      </V51LinkButton>
    );
  }

  return (
    <V51Button type="button" tone={action.tone} onClick={() => onAction?.(action)}>
      {action.label}
    </V51Button>
  );
}
