export type NotificationIntent = {
  userId: string;
  title: string;
  body: string;
};

export type NotificationResult = {
  status: "adapter_not_configured";
};

export interface NotificationAdapter {
  send(input: NotificationIntent): Promise<NotificationResult>;
}

export const notificationAdapter: NotificationAdapter = {
  async send() {
    return { status: "adapter_not_configured" };
  }
};
