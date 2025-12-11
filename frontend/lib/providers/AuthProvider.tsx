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
        setLoading(false);
      } catch (err) {
        console.error("Failed to check session:", err);
        setLoading(false);
      }
    };

    void checkSession();
  }, [setSession, setLoading]);

  return <>{children}</>;
}
