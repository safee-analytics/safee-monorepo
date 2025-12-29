"use client";

import { ReactNode } from "react";
import { useHasModuleAccess } from "@/lib/api/hooks";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

interface ModulePermissionGateProps {
  moduleKey: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModulePermissionGate({ moduleKey, children, fallback }: ModulePermissionGateProps) {
  const canAccess = useHasModuleAccess(moduleKey);
  const router = useRouter();

  if (!canAccess) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-lg p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">Access Denied</h2>
            <p className="text-red-700 dark:text-red-300 mb-6">
              You don&apos;t have permission to access this module. Please contact your administrator if you
              believe this is an error.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => router.back()}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
