"use client";

import { useRequireAuth } from "@/lib/auth/hooks";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { authClient } from "@/lib/auth/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
  fallback = <DashboardSkeleton />,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useRequireAuth(redirectTo);
  const [mounted, setMounted] = useState(false);
  const [checkingOrganization, setCheckingOrganization] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user has an organization
  useEffect(() => {
    async function checkOrganization() {
      // Skip check if not authenticated or still loading
      if (!isAuthenticated || isLoading) {
        setCheckingOrganization(false);
        return;
      }

      // Skip check if already on get-started or onboarding page
      if (pathname === "/get-started" || pathname === "/onboarding") {
        setCheckingOrganization(false);
        return;
      }

      try {
        // Get user's active organization
        const { data, error } = await authClient.organization.getFullOrganization();

        // If no organization or error, redirect to get-started page
        if (!data || error) {
          router.push("/get-started");
          return;
        }

        // Additional check: ensure user is a member of the organization
        if (!data.members || data.members.length === 0) {
          router.push("/get-started");
          return;
        }

        setCheckingOrganization(false);
      } catch (err) {
        console.error("Error checking organization:", err);
        // If error, redirect to get-started for a friendly experience
        router.push("/get-started");
      }
    }

    void checkOrganization();
  }, [isAuthenticated, isLoading, pathname, router]);

  // Show loading state during SSR, initial mount, auth check, or organization check
  // This prevents the flash of login screen
  if (!mounted || isLoading || checkingOrganization) {
    return <>{fallback}</>;
  }

  // If not authenticated after all checks are complete, let useRequireAuth handle redirect
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function withAuth<P extends object>(Component: React.ComponentType<P>, redirectTo = "/login") {
  return function WithAuthComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={redirectTo}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
