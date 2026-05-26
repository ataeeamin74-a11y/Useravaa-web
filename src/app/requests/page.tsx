import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";

export default function RequestsRoute() {
  return (
    <ConversationsPage
      initialTab="incoming"
      title="درخواست‌ها"
      lead="درخواست‌های جلسه مشاوره، وضعیت پاسخ و اقدام‌های لازم را اینجا پیگیری کن."
    />
  );
}
