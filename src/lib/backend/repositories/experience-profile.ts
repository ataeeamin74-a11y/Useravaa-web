import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation } from "./types";

const publicExperienceProfileSelect = {
  id: true,
  ownerId: true,
  profileId: true,
  status: true,
  displayName: true,
  avatarUrl: true,
  roleTitle: true,
  jobField: true,
  orgLevel: true,
  yearsOfExperience: true,
  publicProfessionalSummary: true,
  freeHelp: true,
  price30Toman: true,
  price60Toman: true,
  successfulConversationCount: true,
  csatAverage: true,
  updatedAt: true,
  categories: {
    select: {
      category: {
        select: {
          id: true,
          labelFa: true,
          code: true
        }
      }
    }
  },
  previousCompanies: {
    select: {
      company: {
        select: {
          id: true,
          nameFa: true
        }
      }
    }
  },
  languages: {
    select: {
      language: {
        select: {
          id: true,
          labelFa: true
        }
      }
    }
  }
} as const;

const adminExperienceProfileReviewSelect = {
  id: true,
  ownerId: true,
  profileId: true,
  status: true,
  displayName: true,
  roleTitle: true,
  orgLevel: true,
  yearsOfExperience: true,
  publicProfessionalSummary: true,
  freeHelp: true,
  price30Toman: true,
  price60Toman: true,
  reviewNote: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      userId: true,
      status: true,
      canOfferExperience: true
    }
  },
  _count: {
    select: {
      conversations: true
    }
  }
} as const;

export type AdminExperienceProfileReviewActionInput = {
  profileId: string;
  adminId: string;
  reviewReason?: string;
  reviewNote?: string;
  now: Date;
};

function decisionReviewNote(input: Pick<AdminExperienceProfileReviewActionInput, "reviewReason" | "reviewNote">) {
  return input.reviewNote ?? input.reviewReason ?? null;
}

export const experienceProfileRepository = {
  methods: {
    listPublicProfiles: "read_only_persistent",
    getPublicProfile: "read_only_persistent",
    findForAdminReviewAction: "read_only_persistent",
    approveAdminReview: "database_persistent",
    requestAdminChanges: "database_persistent",
    hideFromDiscover: "database_persistent"
  },
  listPublicProfiles() {
    return readOnlyRepositoryOperation("experience_profile", "listPublicProfiles", (db) =>
      db.experienceProfile.findMany({
        where: { status: "ACTIVE" },
        select: publicExperienceProfileSelect,
        orderBy: { updatedAt: "desc" },
        take: 50
      })
    );
  },
  getPublicProfile(profileId: string) {
    return readOnlyRepositoryOperation("experience_profile", "getPublicProfile", (db) =>
      db.experienceProfile.findFirst({
        where: {
          id: profileId,
          status: "ACTIVE"
        },
        select: publicExperienceProfileSelect
      })
    );
  },
  async findForAdminReviewAction(profileId: string, tx: UseravaaTransactionClient) {
    return tx.experienceProfile.findUnique({
      where: {
        id: profileId
      },
      select: adminExperienceProfileReviewSelect
    });
  },
  async approveAdminReview(input: AdminExperienceProfileReviewActionInput, tx: UseravaaTransactionClient) {
    return tx.experienceProfile.update({
      where: {
        id: input.profileId
      },
      data: {
        status: "ACTIVE",
        reviewNote: input.reviewNote ?? null,
        updatedAt: input.now
      },
      select: adminExperienceProfileReviewSelect
    });
  },
  async requestAdminChanges(input: AdminExperienceProfileReviewActionInput, tx: UseravaaTransactionClient) {
    return tx.experienceProfile.update({
      where: {
        id: input.profileId
      },
      data: {
        status: "NEEDS_CHANGES",
        reviewNote: decisionReviewNote(input),
        updatedAt: input.now
      },
      select: adminExperienceProfileReviewSelect
    });
  },
  async hideFromDiscover(input: AdminExperienceProfileReviewActionInput, tx: UseravaaTransactionClient) {
    return tx.experienceProfile.update({
      where: {
        id: input.profileId
      },
      data: {
        status: "INACTIVE",
        reviewNote: decisionReviewNote(input),
        updatedAt: input.now
      },
      select: adminExperienceProfileReviewSelect
    });
  }
} as const;

export type AdminExperienceProfileReviewRecord = NonNullable<
  Awaited<ReturnType<typeof experienceProfileRepository.findForAdminReviewAction>>
>;
