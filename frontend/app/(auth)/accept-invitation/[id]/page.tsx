"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAcceptInvitation, useInvitation } from "@/lib/api/hooks/organization";
import { useAuth } from "@/lib/auth/hooks";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // Only fetch invitation if authenticated
  const {
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError,
  } = useInvitation(invitationId);
  const acceptInvitation = useAcceptInvitation();
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptInvitation = useCallback(async () => {
    if (!invitationId) return;

    try {
      setIsAccepting(true);
      setError(null);
      await acceptInvitation.mutateAsync({ invitationId });
      // Redirect to the organization after successful acceptance
      router.push("/");
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
      setIsAccepting(false);
    }
  }, [invitationId, acceptInvitation, router]);

  useEffect(() => {
    // If user is authenticated and invitation is loaded, auto-accept
    if (isAuthenticated && invitation && !isAccepting && !acceptInvitation.isPending) {
      handleAcceptInvitation();
    }
  }, [isAuthenticated, invitation, isAccepting, acceptInvitation.isPending, handleAcceptInvitation]);

  const handleLogin = () => {
    // Store the current URL to redirect back after login
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirectAfterLogin", `/accept-invitation/${invitationId}`);
    }
    router.push("/login");
  };

  const handleRegister = () => {
    // Store invitation ID and redirect URL for post-registration
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pendingInvitation", invitationId);
      sessionStorage.setItem("redirectAfterLogin", `/accept-invitation/${invitationId}`);
    }
    router.push("/register");
  };

  // Loading state
  if (authLoading || invitationLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Error state - but only show if we're authenticated and still got an error
  // When not authenticated, Better Auth might not return the invitation details
  if (error || (invitationError && isAuthenticated)) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">
            {error || invitationError?.message || "This invitation link is invalid or has expired."}
          </p>
          <button
            onClick={() => { router.push("/"); }}
            className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Accepting state
  if (isAccepting || acceptInvitation.isPending) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Accepting invitation...</p>
        </div>
      </div>
    );
  }

  // User not authenticated - show login/register options
  if (!isAuthenticated) {
    const organizationName = invitation?.organizationName || "an organization";

    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-safee-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-safee-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;ve Been Invited!</h2>
            <p className="text-gray-600">
              You&apos;ve been invited to join <span className="font-semibold">{organizationName}</span>
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              className="w-full bg-safee-600 hover:bg-safee-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In to Accept
            </button>
            <button
              onClick={handleRegister}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              Create Account & Accept
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center mt-6">
            By accepting, you&apos;ll become a member of {organizationName}
          </p>
        </div>
      </div>
    );
  }

  // This shouldn't be reached as useEffect should auto-accept, but just in case
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing...</p>
      </div>
    </div>
  );
}
