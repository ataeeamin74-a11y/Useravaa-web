import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

export const notificationRepository = {
  methods: {
    listForViewer: "read_only_persistent",
    markRead: "contract_only"
  },
  listForViewer(userId: string) {
    return readOnlyRepositoryOperation("notification", "listForViewer", (db) =>
      db.notification.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          type: true,
          status: true,
          title: true,
          body: true,
          deepLink: true,
          relatedEntityType: true,
          relatedEntityId: true,
          conversationId: true,
          createdAt: true,
          readAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 100
      })
    );
  },
  markRead() {
    return repositoryNotImplemented("notification", "markRead");
  }
} as const;

