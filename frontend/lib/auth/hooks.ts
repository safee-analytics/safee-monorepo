"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { authClient } from "./client";

export function useAuth() {
  const router = useRouter();
  const { user, session, isLoading, isAuthenticated, setSession, setLoading, clearAuth } = useAuthStore();

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const response = await authClient.signIn.email({ email, password });

        if (response.error) {
          return {
            success: false,
            error: response.error.message || "Sign in failed",
          };
        }

        const sessionData = await authClient.getSession();
        if (sessionData.data) {
          setSession(sessionData.data);
        }

        return { success: true };
      } catch (error) {
        console.error("Sign in error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Sign in failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [setSession, setLoading],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        setLoading(true);
        const response = await authClient.signUp.email({ email, password, name });

        if (response.error) {
          return {
            success: false,
            error: response.error.message || "Sign up failed",
          };
        }

        const sessionData = await authClient.getSession();
        if (sessionData.data) {
          setSession(sessionData.data);
        }

        return { success: true };
      } catch (error) {
        console.error("Sign up error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Sign up failed",
        };
      } finally {
        setLoading(false);
      }
    },
    [setSession, setLoading],
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authClient.signOut();
      clearAuth();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
      // Clear auth anyway on client side
      clearAuth();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [clearAuth, router, setLoading]);

  const signInWithGoogle = useCallback(() => {
    authClient.signIn.social({ provider: "google" });
  }, []);

  const signInWithGithub = useCallback(() => {
    authClient.signIn.social({ provider: "github" });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const sessionData = await authClient.getSession();
      if (sessionData.data) {
        setSession(sessionData.data);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
      clearAuth();
    }
  }, [setSession, clearAuth]);

  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithGithub,
    refreshSession,
  };
}

/**
 * Hook that requires authentication and redirects if not authenticated
 */
export function useRequireAuth(redirectTo: string = "/login") {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return {
    isAuthenticated,
    isLoading,
  };
}
