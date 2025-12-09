"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { LogOutIcon, MenuIcon } from "lucide-react";
import type { CurrentUser } from "@/lib/auth/permissions";

interface AdminHeaderProps {
  user: CurrentUser;
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden -m-2.5 p-2.5 text-gray-700 dark:text-gray-300"
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 lg:hidden" />

      {/* Right side */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center justify-end">
        {/* Organization Badge (for org admins) */}
        {user.role !== "admin" && user.organizationId && (
          <div className="hidden sm:flex items-center gap-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Org: {user.organizationId.slice(0, 8)}...
            </span>
          </div>
        )}

        {/* Global Access Badge (for super admins) */}
        {user.role === "admin" && (
          <div className="hidden sm:flex items-center gap-x-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Global Access
            </span>
          </div>
        )}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
          <LogOutIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
