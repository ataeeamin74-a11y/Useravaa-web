import type { Viewer } from "@/lib/auth/types";

export type SessionUser = Viewer & {
  id: string;
  email?: string;
};

export interface AuthAdapter {
  getCurrentUser(): Promise<SessionUser | null>;
}

export const authAdapter: AuthAdapter = {
  async getCurrentUser() {
    return null;
  }
};
