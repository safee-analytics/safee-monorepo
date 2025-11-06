"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { authClient } from "./client";

export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();
  const { user, session, isLoading, isAuthenticated, setSession, setLoading, clearAuth } = store;
  const hasInitialized = useRef(false);

  // Initialize session on mount - check if existing session is still valid
  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeAuth = async () => {
      try {
        const sessionData = await authClient.getSession();
        if (sessionData.data) {
          setSession(sessionData.data);
        } else {
          clearAuth();
        }
      } catch (error) {
        // Silently fail if backend not available
      } finally {
        setLoading(false);
        hasInitialized.current = true;
      }
    };

    initializeAuth();
  }, [setSession, setLoading, clearAuth]);

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
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store full URL (with query params) in session storage so we can redirect back after login
      if (typeof window !== 'undefined' && pathname) {
        const fullUrl = window.location.pathname + window.location.search;
        // Only store if it's not the login page itself
        if (pathname !== redirectTo && pathname !== '/') {
          sessionStorage.setItem('redirectAfterLogin', fullUrl);
        }
      }
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, pathname]);

  return {
    isAuthenticated,
    isLoading,
  };
}
