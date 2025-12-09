"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            You don't have permission to access the admin dashboard.
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Only administrators and organization admins can access this area.
          </p>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
