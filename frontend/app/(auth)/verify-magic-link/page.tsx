"use client";

import { Suspense, useEffect, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/hooks";

function VerifyMagicLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return;

    // Check if authentication was successful
    if (isAuthenticated) {
      // Get redirect URL from query params or default to "/"
      const redirectUrl = searchParams.get("redirect") || "/";

      // Small delay to show success message
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } else {
      // If not authenticated after loading, there might be an error
      startTransition(() => {
        setIsVerifying(false);
        setError("Failed to verify magic link. The link may have expired or is invalid.");
      });
    }
  }, [isAuthenticated, isLoading, router, searchParams]);

  // Verifying state
  if (isVerifying && !error) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {isAuthenticated ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">Redirecting you now...</p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Magic Link</h2>
              <p className="text-gray-600">Please wait while we sign you in...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => {
            router.push("/login");
          }}
          className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyMagicLinkContent />
    </Suspense>
  );
}
