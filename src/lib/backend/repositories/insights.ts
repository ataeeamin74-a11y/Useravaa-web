import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

const publicInsightSelect = {
  id: true,
  slug: true,
  title: true,
  prompt: true,
  body: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
  experienceProfile: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      roleTitle: true,
      orgLevel: true,
      yearsOfExperience: true
    }
  },
  answers: {
    where: { status: "APPROVED" as const },
    select: {
      id: true,
      renderedQuestion: true,
      answerText: true,
      audienceIntents: true,
      approvedAt: true,
      experienceProfile: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          roleTitle: true
        }
      }
    },
    orderBy: { approvedAt: "desc" as const },
    take: 20
  }
} as const;

const adminInsightModerationSelect = {
  id: true,
  slug: true,
  title: true,
  prompt: true,
  body: true,
  status: true,
  authorUserId: true,
  experienceProfileId: true,
  publishedAt: true,
  hiddenAt: true,
  createdAt: true,
  updatedAt: true,
  authorUser: {
    select: {
      id: true,
      displayName: true
    }
  },
  experienceProfile: {
    select: {
      id: true,
      displayName: true,
      roleTitle: true,
      jobField: true,
      categories: {
        select: {
          category: {
            select: {
              labelFa: true,
              code: true
            }
          }
        }
      }
    }
  },
  answers: {
    select: {
      id: true,
      authorUserId: true,
      renderedQuestion: true,
      answerText: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
      hiddenAt: true,
      authorUser: {
        select: {
          id: true,
          displayName: true
        }
      },
      experienceProfile: {
        select: {
          id: true,
          displayName: true,
          roleTitle: true
        }
      }
    },
    orderBy: { updatedAt: "desc" as const },
    take: 20
  },
  _count: {
    select: {
      answers: true
    }
  }
} as const;

const adminInsightAnswerModerationSelect = {
  id: true,
  authorUserId: true,
  experienceProfileId: true,
  experienceQuestionId: true,
  insightId: true,
  renderedQuestion: true,
  answerText: true,
  audienceIntents: true,
  status: true,
  submittedAt: true,
  approvedAt: true,
  rejectedAt: true,
  hiddenAt: true,
  createdAt: true,
  updatedAt: true,
  authorUser: {
    select: {
      id: true,
      displayName: true
    }
  },
  insight: {
    select: {
      id: true,
      status: true,
      title: true,
      slug: true
    }
  }
} as const;

export type AdminInsightModerationInput = {
  insightId: string;
  adminId: string;
  reasonCode?: string;
  reviewNote?: string;
  now: Date;
};

export type AdminInsightAnswerModerationInput = {
  answerId: string;
  adminId: string;
  reasonCode?: string;
  reviewNote?: string;
  now: Date;
};

export const insightsRepository = {
  methods: {
    listPublic: "read_only_persistent",
    getPublicBySlug: "read_only_persistent",
    submitAnswer: "contract_only",
    listForAdminModeration: "read_only_persistent",
    getForAdminModeration: "read_only_persistent",
    findInsightForAdminAction: "read_only_persistent",
    findInsightAnswerForAdminAction: "read_only_persistent",
    hideInsight: "database_persistent",
    restoreInsight: "database_persistent",
    archiveInsight: "database_persistent",
    hideInsightAnswer: "database_persistent"
  },
  listPublic() {
    return readOnlyRepositoryOperation("insight", "listPublic", (db) =>
      db.insight.findMany({
        where: { status: "PUBLISHED" },
        select: publicInsightSelect,
        orderBy: { publishedAt: "desc" },
        take: 50
      })
    );
  },
  getPublicBySlug(slug: string) {
    return readOnlyRepositoryOperation("insight", "getPublicBySlug", (db) =>
      db.insight.findFirst({
        where: {
          slug,
          status: "PUBLISHED"
        },
        select: publicInsightSelect
      })
    );
  },
  submitAnswer() {
    return repositoryNotImplemented("insight_answer", "submitAnswer");
  },
  listForAdminModeration() {
    return readOnlyRepositoryOperation("insight", "listForAdminModeration", (db) =>
      db.insight.findMany({
        select: adminInsightModerationSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getForAdminModeration(insightId: string) {
    return readOnlyRepositoryOperation("insight", "getForAdminModeration", (db) =>
      db.insight.findUnique({
        where: {
          id: insightId
        },
        select: adminInsightModerationSelect
      })
    );
  },
  async findInsightForAdminAction(insightId: string, tx: UseravaaTransactionClient) {
    return tx.insight.findUnique({
      where: {
        id: insightId
      },
      select: adminInsightModerationSelect
    });
  },
  async findInsightAnswerForAdminAction(answerId: string, tx: UseravaaTransactionClient) {
    return tx.insightAnswer.findUnique({
      where: {
        id: answerId
      },
      select: adminInsightAnswerModerationSelect
    });
  },
  async hideInsight(input: AdminInsightModerationInput, tx: UseravaaTransactionClient) {
    return tx.insight.update({
      where: {
        id: input.insightId
      },
      data: {
        status: "HIDDEN",
        hiddenAt: input.now,
        updatedAt: input.now
      },
      select: adminInsightModerationSelect
    });
  },
  async restoreInsight(input: AdminInsightModerationInput, tx: UseravaaTransactionClient) {
    return tx.insight.update({
      where: {
        id: input.insightId
      },
      data: {
        status: "PUBLISHED",
        hiddenAt: null,
        publishedAt: input.now,
        updatedAt: input.now
      },
      select: adminInsightModerationSelect
    });
  },
  async archiveInsight(input: AdminInsightModerationInput, tx: UseravaaTransactionClient) {
    return tx.insight.update({
      where: {
        id: input.insightId
      },
      data: {
        status: "ARCHIVED",
        hiddenAt: input.now,
        updatedAt: input.now
      },
      select: adminInsightModerationSelect
    });
  },
  async hideInsightAnswer(input: AdminInsightAnswerModerationInput, tx: UseravaaTransactionClient) {
    return tx.insightAnswer.update({
      where: {
        id: input.answerId
      },
      data: {
        status: "HIDDEN",
        hiddenAt: input.now,
        updatedAt: input.now
      },
      select: adminInsightAnswerModerationSelect
    });
  }
} as const;

export type AdminInsightModerationRecord = NonNullable<
  Awaited<ReturnType<typeof insightsRepository.findInsightForAdminAction>>
>;
export type AdminInsightAnswerModerationRecord = NonNullable<
  Awaited<ReturnType<typeof insightsRepository.findInsightAnswerForAdminAction>>
>;
