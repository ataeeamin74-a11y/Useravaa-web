export type UserRole = "USER" | "ADMIN" | "SUPPORT";

export type Viewer = {
  id: string;
  role: UserRole;
  displayName?: string;
  canOfferExperience?: boolean;
};

export type AuthSession = {
  viewer: Viewer | null;
  source: "dev_fixture" | "provider" | "staging_access" | "none";
};
