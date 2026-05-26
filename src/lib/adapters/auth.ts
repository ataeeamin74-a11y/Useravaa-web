export type SessionUser = {
  id: string;
  email: string;
};

export interface AuthAdapter {
  getCurrentUser(): Promise<SessionUser | null>;
}

export const authAdapter: AuthAdapter = {
  async getCurrentUser() {
    return null;
  }
};
