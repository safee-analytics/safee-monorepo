"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { authApi } from "./client";

export function useAuth() {
  const router = useRouter();
  const { user, session, isLoading, isAuthenticated, setSession, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const sessionData = await authApi.getSession();
        setSession(sessionData);
      } catch (error) {
        console.error("Failed to check session:", error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setSession, setLoading, clearAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const response = await authApi.signIn({ email, password });

        const sessionData = await authApi.getSession();
        setSession(sessionData);

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
    async (email: string, password: string, name: string, organizationName: string) => {
      try {
        setLoading(true);
        await authApi.signUp({ email, password, name, organizationName });

        const sessionData = await authApi.getSession();
        setSession(sessionData);

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
      await authApi.signOut();
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
    authApi.signInWithGoogle();
  }, []);

  const signInWithGithub = useCallback(() => {
    authApi.signInWithGithub();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const sessionData = await authApi.getSession();
      setSession(sessionData);
      return !!sessionData;
    } catch (error) {
      console.error("Failed to refresh session:", error);
      clearAuth();
      return false;
    } finally {
      setLoading(false);
    }
  }, [setSession, setLoading, clearAuth]);

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

export function useRequireAuth(redirectTo: string = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

export function useSession() {
  const { user, session, isAuthenticated, isLoading } = useAuthStore();

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
  };
}
