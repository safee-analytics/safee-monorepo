"use client";

import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to access the admin dashboard. This area is restricted to super
          administrators only.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            Sign Out
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-500">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}
