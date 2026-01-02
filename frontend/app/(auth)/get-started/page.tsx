"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Users,
  Shield,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { SafeeLogo } from "@/components/common/SafeeLogo";
import { twMerge } from "tailwind-merge";

interface PendingInvitation {
  id: string;
  organizationName: string;
  inviterName: string;
  role: string;
  expiresAt: string;
}

export default function GetStartedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [checkingInvitations, setCheckingInvitations] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check for pending invitations
  useEffect(() => {
    const checkInvitations = async () => {
      try {
        const { data } = await authClient.organization.listUserInvitations();
        if (data && data.length > 0) {
          const mappedInvitations: PendingInvitation[] = data.map((inv) => ({
            id: inv.id,
            organizationName: "Organization",
            inviterName: "Team Admin",
            role: inv.role,
            expiresAt: inv.expiresAt.toISOString(),
          }));
          setPendingInvitations(mappedInvitations);
        }
      } catch (err) {
        console.error("Failed to load invitations:", err);
      } finally {
        setCheckingInvitations(false);
      }
    };

    void checkInvitations();
  }, []);

  const handleAcceptInvitation = async (invitationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to accept invitation");
      }

      // Refresh session
      await authClient.getSession({
        fetchOptions: {
          query: {
            disableCookieCache: true,
          },
        },
      });

      // Redirect to dashboard
      router.push("/");
    } catch (err) {
      console.error("Failed to accept invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAgain = async () => {
    setCheckingInvitations(true);
    setError(null);

    try {
      const { data } = await authClient.organization.listUserInvitations();
      if (data && data.length > 0) {
        const mappedInvitations: PendingInvitation[] = data.map((inv) => ({
          id: inv.id,
          organizationName: "Organization",
          inviterName: "Team Admin",
          role: inv.role,
          expiresAt: inv.expiresAt.toISOString(),
        }));
        setPendingInvitations(mappedInvitations);
      } else {
        setError("No invitations found yet. Ask your team admin to send you an invitation.");
      }
    } catch (err) {
      console.error("Failed to check invitations:", err);
      setError("Failed to check for invitations. Please try again.");
    } finally {
      setCheckingInvitations(false);
    }
  };

  const handleCreateOrganization = () => {
    router.push("/onboarding");
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 min-h-screen py-12 px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md"
        >
          {error}
        </motion.div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="inline-block">
            <SafeeLogo size="lg" />
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-safee-400 to-safee-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-safee-500/30"
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Welcome to Safee Analytics!</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your all-in-one platform for audit, accounting, HR, and CRM management
              </p>
            </div>

            {/* Pending invitations */}
            {checkingInvitations ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safee-500 mx-auto mb-4" />
                <p className="text-gray-600">Checking for invitations...</p>
              </div>
            ) : pendingInvitations.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">You&apos;ve been invited!</h2>
                      <p className="text-gray-700">
                        Accept an invitation below to join an existing organization and start collaborating
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-safee-400 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-safee-500" />
                            {invitation.organizationName}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              Invited by: <span className="font-medium">{invitation.inviterName}</span>
                            </p>
                            <p>
                              Role: <span className="font-medium capitalize">{invitation.role}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => void handleAcceptInvitation(invitation.id)}
                          disabled={isLoading}
                          className={twMerge(
                            "px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2",
                            isLoading && "opacity-50 cursor-not-allowed hover:scale-100",
                          )}
                        >
                          {isLoading ? "Accepting..." : "Accept Invitation"}
                          {!isLoading && <ArrowRight className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {/* Options grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Create Organization */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-safee-400 to-safee-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-safee-400 transition-all cursor-pointer">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-safee-400 to-safee-600 flex items-center justify-center mb-4">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Organization</h3>
                  <p className="text-gray-600 mb-6">
                    Start your own workspace and invite your team. Choose from flexible subscription plans.
                  </p>
                  <button
                    onClick={handleCreateOrganization}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>

              {/* Wait for Invitation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-400 transition-all">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center mb-4">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Waiting for Invitation?</h3>
                  <p className="text-gray-600 mb-6">
                    Ask your team admin to send you an invitation. You&apos;ll be able to join once you receive it.
                  </p>
                  <button
                    onClick={() => void handleCheckAgain()}
                    disabled={checkingInvitations}
                    className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingInvitations ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Check for Invitations
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Features showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="border-t border-gray-200 pt-8"
            >
              <h3 className="text-center text-lg font-semibold text-gray-900 mb-6">
                What you&apos;ll get with Safee Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Enterprise Security</h4>
                  <p className="text-sm text-gray-600">End-to-end encryption and compliance</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Team Collaboration</h4>
                  <p className="text-sm text-gray-600">Work together in real-time</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Powerful Automation</h4>
                  <p className="text-sm text-gray-600">Streamline your workflows</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm text-gray-600"
        >
          <p>
            Need help?{" "}
            <a href="mailto:support@safee.dev" className="text-safee-600 hover:text-safee-700 font-medium">
              Contact support
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
