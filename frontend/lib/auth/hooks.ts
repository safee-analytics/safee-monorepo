"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, useSignIn, useSignUp, useSignOut, useSignInWithGoogle } from "@/lib/api/hooks";

export function useAuth() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading, error: sessionError } = useSession();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const signOutMutation = useSignOut();
  const googleSignInMutation = useSignInWithGoogle();

  const user = session?.user;
  const isAuthenticated = !!user;
  const isLoading = sessionLoading || signInMutation.isPending || signUpMutation.isPending;

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        await signInMutation.mutateAsync({ email, password });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sign in failed",
        };
      }
    },
    [signInMutation],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        await signUpMutation.mutateAsync({ email, password, name });
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sign up failed",
        };
      }
    },
    [signUpMutation],
  );

  const signOut = useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      // Try to redirect anyway
      router.push("/login");
    }
  }, [signOutMutation, router]);

  const signInWithGoogle = useCallback(
    async (callbackURL?: string) => {
      try {
        await googleSignInMutation.mutateAsync({ callbackURL });
      } catch (err) {
        console.error("Google sign in error:", err);
        throw err;
      }
    },
    [googleSignInMutation],
  );

  const signInWithGithub = useCallback(() => {
    // TODO: [Backend/Frontend] - Add GitHub provider to Better Auth config
    //   Details: Configure the GitHub OAuth provider in the Better Auth backend. Once configured, enable the frontend integration for GitHub sign-in.
    //   Priority: Medium
    console.warn("GitHub sign in not yet configured");
  }, []);

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
    sessionError,
  };
}

export function useRequireAuth(redirectTo = "/login") {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store full URL (with query params) in session storage so we can redirect back after login
      if (typeof window !== "undefined" && pathname) {
        const fullUrl = window.location.pathname + window.location.search;
        // Only store if it's not the login page itself
        if (pathname !== redirectTo && pathname !== "/") {
          sessionStorage.setItem("redirectAfterLogin", fullUrl);
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
