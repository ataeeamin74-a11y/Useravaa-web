import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

export const profileRepository = {
  methods: {
    getCurrentProfile: "read_only_persistent",
    updateCurrentProfile: "contract_only",
    submitForReview: "contract_only"
  },
  getCurrentProfile(userId: string) {
    return readOnlyRepositoryOperation("profile", "getCurrentProfile", (db) =>
      db.profile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          status: true,
          displayName: true,
          avatarUrl: true,
          professionalSummary: true,
          userMotivations: true,
          userMotivationOtherText: true,
          canOfferExperience: true,
          createdAt: true,
          updatedAt: true,
          experienceProfile: {
            select: {
              id: true,
              status: true,
              roleTitle: true,
              publicProfessionalSummary: true,
              freeHelp: true,
              price30Toman: true,
              price60Toman: true
            }
          }
        }
      })
    );
  },
  updateCurrentProfile() {
    return repositoryNotImplemented("profile", "updateCurrentProfile");
  },
  submitForReview() {
    return repositoryNotImplemented("profile", "submitForReview");
  }
} as const;

