import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "@/lib/auth/client";

// Use inferred User type from Better Auth instead of manual definition
// This automatically includes all plugin fields (twoFactor, phoneNumber, apiKey, etc.)
export type AuthUser = User;

// Use inferred Session type from Better Auth (excluding the 'user' property since we store it separately)
export type AuthSession = Omit<Session['session'], 'user'>;

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true, // Start as loading so we don't redirect before checking session
      isAuthenticated: false,

      setSession: (sessionData) => {
        if (sessionData) {
          set({
            user: sessionData.user,
            session: sessionData.session,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      clearAuth: () =>
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: "safee-auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
