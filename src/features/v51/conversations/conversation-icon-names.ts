import type { UseravaaIconName } from "@/components/ui/UseravaaIcon";
import type { ConversationNotificationType, ConversationRequestStatus, ConversationSectionKey } from "@/features/v51/data/conversations";

export const conversationSectionIconNames: Record<ConversationSectionKey, UseravaaIconName> = {
  needsAction: "warning",
  requestStage: "sessionRequest",
  inProgress: "sessionRequest",
  confirmedSessions: "sessionBooking",
  history: "archive"
};

export function getConversationStatusIconName(status: ConversationRequestStatus): UseravaaIconName {
  switch (status) {
    case "pending_provider_response":
      return "sessionRequest";
    case "times_proposed":
      return "sessionTime";
    case "new_time_requested":
      return "reply";
    case "pending_payment":
      return "paymentCard";
    case "payment_not_required":
      return "success";
    case "payment_processing":
      return "sessionTime";
    case "confirmed":
      return "sessionBooking";
    case "completed":
      return "success";
    case "refunded":
      return "transaction";
    case "cancelled":
      return "archive";
    case "expired":
    case "rejected":
      return "warning";
  }
}

export const conversationNotificationIconNames: Record<ConversationNotificationType, UseravaaIconName> = {
  new_request: "sessionRequest",
  proposed_times: "sessionTime",
  near_expiration: "warning",
  confirmed: "sessionBooking",
  one_hour_reminder: "sessionTime",
  expired: "warning",
  cancellation: "archive",
  new_time_request: "reply",
  new_time_options: "sessionTime",
  provider_time_replacement: "sessionTime"
};
