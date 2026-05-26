import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";

export default function SessionsRoute() {
  return (
    <ConversationsPage
      initialTab="outgoing"
      title="جلسه‌ها"
      lead="جلسه‌های مشاوره، زمان‌های پیشنهادی و وضعیت پرداخت را اینجا دنبال کن."
    />
  );
}
