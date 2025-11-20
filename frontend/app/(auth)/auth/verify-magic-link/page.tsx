"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVerifyMagicLink } from "@/lib/api/hooks";
import { motion } from "framer-motion";

export default function VerifyMagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMagicLinkMutation = useVerifyMagicLink();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyToken = async () => {
      // Get token from URL
      const token = searchParams.get("token");
      const redirect = searchParams.get("redirect") || "/";

      if (!token) {
        setStatus("error");
        setErrorMessage("Invalid or missing verification token.");
        return;
      }

      try {
        await verifyMagicLinkMutation.mutateAsync(token);
        setStatus("success");

        // Redirect after a short delay
        setTimeout(() => {
          router.push(redirect);
        }, 2000);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to verify magic link. The link may have expired or is invalid.",
        );
      }
    };

    verifyToken();
  }, [searchParams, router, verifyMagicLinkMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center"
      >
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 border-4 border-safee-200 border-t-safee-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h1>
            <p className="text-gray-600">Please wait while we verify your magic link.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">You have been successfully signed in. Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2 bg-safee-600 text-white rounded-lg hover:bg-safee-700 transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
