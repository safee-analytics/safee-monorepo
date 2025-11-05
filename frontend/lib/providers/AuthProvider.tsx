"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { authClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const sessionData = await authClient.getSession();
        if (sessionData.data) {
          setSession(sessionData.data);
        }
        // Always set loading to false regardless of result
        setLoading(false);
      } catch (error) {
        console.error("Failed to check session:", error);
        // On error, don't clear auth - just stop loading
        // This prevents clearing auth due to network errors
        setLoading(false);
      }
    };

    checkSession();
  }, [setSession, setLoading]);

  return <>{children}</>;
}
