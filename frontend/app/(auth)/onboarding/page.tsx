"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calculator,
  FileCheck,
  UserCircle,
  Mail,
  Plus,
  X,
} from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { apiClient } from "@/lib/api/client";
import { twMerge } from "tailwind-merge";
import { logError } from "@/lib/utils/logger";
import { SafeeLogo as SafeeLogoComponent } from "@/components/common/SafeeLogo";
import {
  type Module,
  moduleSchema,
  type PendingInvitation,
  pendingInvitationSchema,
  type SubscriptionPlan,
  subscriptionPlanSchema,
  type CurrentSubscription,
  currentSubscriptionSchema,
  type TeamMember,
  teamMemberSchema,
} from "@/lib/validation";

// Multi-step onboarding types
type OnboardingStep =
  | "invitation"
  | "accept-invitation"
  | "plan"
  | "organization"
  | "team"
  | "modules"
  | "complete";

const AVAILABLE_MODULES: Module[] = moduleSchema.array().parse([
  {
    id: "accounting",
    name: "Hisabiq - Accounting",
    description: "Financial management, invoicing, and reporting",
    icon: Calculator,
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "audit",
    name: "Audit & Compliance",
    description: "Audit planning, execution, and reporting",
    icon: FileCheck,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "crm",
    name: "Nisbah - CRM",
    description: "Customer relationship management",
    icon: Users,
    color: "from-pink-500 to-pink-600",
  },
  {
    id: "hr",
    name: "Kanz - HR & Payroll",
    description: "Employee management and payroll processing",
    icon: UserCircle,
    color: "from-indigo-500 to-indigo-600",
  },
]);

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("plan");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invitation step
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);

  // Plan step
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentSubscription | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState(1);

  // Organization step
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [industry, setIndustry] = useState("");

  // Team step
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Modules step
  const [selectedModules, setSelectedModules] = useState<string[]>(["accounting"]);

  // Load onboarding status and plans on mount
  useEffect(() => {
    const loadOnboardingData = async () => {
      try {
        // Load available plans
        const { data: plansData } = await apiClient.GET("/subscriptions/plans", {});
        if (plansData) {
          setPlans(subscriptionPlanSchema.array().parse(plansData));
        }

        // Load current status
        const { data: statusData } = await apiClient.GET("/onboarding/status", {});
        if (statusData) {
          setCurrentPlan(currentSubscriptionSchema.parse(statusData.subscription));

          // Check for pending invitations using Better Auth client
          const { data: invitationsData } = await authClient.organization.listUserInvitations();
          if (invitationsData && invitationsData.length > 0) {
            setPendingInvitations(pendingInvitationSchema.array().parse(invitationsData));
          }

          // Navigate to appropriate step based on backend status
          if (statusData.currentStep === "completed") {
            router.push("/");
          } else if (invitationsData && invitationsData.length > 0) {
            setCurrentStep("invitation");
          } else if (statusData.currentStep === "create-organization") {
            setCurrentStep("organization");
          } else if (statusData.currentStep === "select-plan") {
            setCurrentStep("plan");
          }
        }
      } catch (err) {
        console.error("Failed to load onboarding data:", err);
      }
    };

    void loadOnboardingData();
  }, [router]);

  // Handle plan selection or skip - just store in state
  const handleSelectPlan = async (planId: string | null, seats: number) => {
    setError(null);

    // Store plan selection in state
    if (planId) {
      const selectedPlan = plans.find((p) => p.id === planId);
      if (selectedPlan) {
        setCurrentPlan({
          isFree: selectedPlan.pricePerSeat === "0",
          seats,
          planSlug: selectedPlan.slug,
          planName: selectedPlan.name,
        });
      }
      setSelectedPlanId(planId);
      setSelectedSeats(seats);
    }

    // Move to next step without API call
    setCurrentStep("organization");
  };

  // Just generate slug from organization name - no checking yet
  const handleNameChange = (value: string) => {
    setOrganizationName(value);

    if (!value.trim()) {
      setOrganizationSlug("");
      return;
    }

    const baseSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      .slice(0, 50);

    setOrganizationSlug(baseSlug);
  };

  // Add team member
  const handleAddTeamMember = () => {
    if (newMemberEmail && !teamMembers.find((m) => m.email === newMemberEmail)) {
      setTeamMembers([...teamMembers, teamMemberSchema.parse({ email: newMemberEmail, role: "member" })]);
      setNewMemberEmail("");
    }
  };

  // Remove team member
  const handleRemoveTeamMember = (email: string) => {
    setTeamMembers(teamMembers.filter((m) => m.email !== email));
  };

  // Toggle module selection
  const toggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    );
  };

  // Validate organization details and move to next step
  const handleCreateOrganization = () => {
    if (!organizationName || !organizationSlug) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    // Just move to next step - organization will be created at the end
    setCurrentStep("team");
  };

  // Accept an invitation to join an organization
  const handleAcceptInvitation = async (invitationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use Better Auth to accept the invitation
      const response = await authClient.organization.acceptInvitation({
        invitationId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to accept invitation");
      }

      // Refresh session to get the new activeOrganizationId
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

  // Reject an invitation
  const handleRejectInvitation = async (invitationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authClient.organization.rejectInvitation({
        invitationId,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to reject invitation");
      }

      // Remove the rejected invitation from the list
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // If no more invitations, move to plan step
      if (pendingInvitations.length <= 1) {
        setCurrentStep("plan");
      }
    } catch (err) {
      console.error("Failed to reject invitation:", err);
      setError(err instanceof Error ? err.message : "Failed to reject invitation");
    } finally {
      setIsLoading(false);
    }
  };

  // Skip invitations and create own organization
  const handleSkipInvitations = () => {
    setCurrentStep("plan");
  };

  // Complete onboarding - create everything at once
  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create/update subscription if plan was selected
      if (selectedPlanId) {
        const { error: planError } = await apiClient.POST("/onboarding/upgrade-plan", {
          body: { planId: selectedPlanId, seats: selectedSeats },
        });

        if (planError) {
          throw new Error("Failed to set up subscription plan");
        }
      }

      // Step 2: Get available slug for organization
      const { data: slugData, error: slugError } = await apiClient.GET("/organizations/slugs/next", {
        params: { query: { baseSlug: organizationSlug } },
      });

      if (slugError || !slugData) {
        throw new Error("Failed to generate unique organization slug");
      }

      // Step 3: Create organization
      const orgResponse = await authClient.organization.create({
        name: organizationName,
        slug: slugData.nextSlug,
        metadata: {
          industry,
          selectedModules,
        },
      });

      if (orgResponse.error) {
        throw new Error(orgResponse.error.message || "Failed to create organization");
      }

      // IMPORTANT: Refresh the session to get the updated activeOrganizationId
      // The backend hook updates the session, but we need to refetch it from the server
      // Disable cookie cache to force a fresh fetch from the database
      await authClient.getSession({
        fetchOptions: {
          query: {
            disableCookieCache: true,
          },
        },
      });

      // Step 4: Send team member invitations
      if (teamMembers.length > 0) {
        for (const member of teamMembers) {
          try {
            await authClient.organization.inviteMember({
              email: member.email,
              role: member.role,
            });
          } catch (err) {
            // TODO: [Backend/Frontend] - Handle individual invitation failures during onboarding
            //   Details: When inviting multiple team members, some invitations might fail (e.g., invalid email). This `console.warn` needs to be replaced with a robust error handling mechanism, potentially showing user-specific feedback without blocking the entire onboarding process.
            //   Priority: Medium
            logError("Failed to invite team member during onboarding", err, { email: member.email });
            // Continue even if some invites fail
          }
        }
      }

      // All done!
      setCurrentStep("complete");

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
      setIsLoading(false);
    }
  };

  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep === "plan") {
      // Handled by handleSelectPlan
      return;
    } else if (currentStep === "organization") {
      handleCreateOrganization();
    } else if (currentStep === "team") {
      setCurrentStep("modules");
    } else if (currentStep === "modules") {
      void handleCompleteOnboarding();
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === "organization") setCurrentStep("plan");
    else if (currentStep === "team") setCurrentStep("organization");
    else if (currentStep === "modules") setCurrentStep("team");
  };

  const canProceed = (): boolean => {
    if (currentStep === "plan") return true; // Always can proceed from plan
    if (currentStep === "organization") return !!(organizationName && organizationSlug);
    if (currentStep === "team") return true; // Team is optional
    if (currentStep === "modules") return selectedModules.length > 0;
    return false;
  };

  const steps: { id: OnboardingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "plan", label: "Plan", icon: CheckCircle2 },
    { id: "organization", label: "Organization", icon: Building2 },
    { id: "team", label: "Team", icon: Users },
    { id: "modules", label: "Modules", icon: Sparkles },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen py-20 relative overflow-hidden">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 z-50 px-4 py-3 rounded-lg bg-red-500 text-white shadow-lg max-w-md"
        >
          {error}
        </motion.div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-4xl p-4">
        {/* Logo */}
        {currentStep !== "complete" && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <SafeeLogo />
          </motion.div>
        )}

        {/* Progress indicator */}
        {currentStep !== "complete" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = index < currentStepIndex;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={twMerge(
                        "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                        isActive && "bg-safee-100 ring-2 ring-safee-500",
                        isCompleted && "bg-green-100",
                        !isActive && !isCompleted && "bg-gray-100",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Icon className={twMerge("w-5 h-5", isActive ? "text-safee-600" : "text-gray-400")} />
                      )}
                      <span
                        className={twMerge(
                          "text-sm font-medium",
                          isActive ? "text-safee-600" : isCompleted ? "text-green-600" : "text-gray-500",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={twMerge(
                          "w-12 h-0.5 mx-2",
                          index < currentStepIndex ? "bg-green-500" : "bg-gray-300",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          {currentStep === "invitation" && (
            <InvitationStep
              key="invitation"
              invitations={pendingInvitations}
              onAccept={handleAcceptInvitation}
              onReject={handleRejectInvitation}
              onSkip={handleSkipInvitations}
              isLoading={isLoading}
            />
          )}

          {currentStep === "plan" && (
            <PlanStep
              key="plan"
              plans={plans}
              currentPlan={currentPlan}
              onSelectPlan={handleSelectPlan}
              isLoading={isLoading}
            />
          )}

          {currentStep === "organization" && (
            <OrganizationStep
              key="organization"
              organizationName={organizationName}
              industry={industry}
              onNameChange={handleNameChange}
              onIndustryChange={setIndustry}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              canProceed={canProceed()}
            />
          )}

          {currentStep === "team" && (
            <TeamStep
              key="team"
              teamMembers={teamMembers}
              newMemberEmail={newMemberEmail}
              onNewMemberEmailChange={setNewMemberEmail}
              onAddMember={handleAddTeamMember}
              onRemoveMember={handleRemoveTeamMember}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}

          {currentStep === "modules" && (
            <ModulesStep
              key="modules"
              selectedModules={selectedModules}
              onToggleModule={toggleModule}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              isLoading={isLoading}
              canProceed={canProceed()}
            />
          )}

          {currentStep === "complete" && <CompleteStep key="complete" organizationName={organizationName} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step Components
function InvitationStep({
  invitations,
  onAccept,
  onReject,
  onSkip,
  isLoading,
}: {
  invitations: PendingInvitation[];
  onAccept: (invitationId: string) => Promise<void>;
  onReject: (invitationId: string) => Promise<void>;
  onSkip: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl mx-auto"
    >
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/50 mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You&apos;ve been invited!</h1>
        <p className="text-gray-600">
          Accept an invitation to join an existing organization, or create your own
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="border-2 border-gray-200 rounded-xl p-6 hover:border-safee-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{invitation.organizationName}</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    Invited by: <span className="font-medium">{invitation.inviterName}</span>
                  </p>
                  <p>
                    Role: <span className="font-medium capitalize">{invitation.role}</span>
                  </p>
                  <p>
                    Expires:{" "}
                    <span className="font-medium">{new Date(invitation.expiresAt).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => void onReject(invitation.id)}
                  disabled={isLoading}
                  className={twMerge(
                    "px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 active:scale-95",
                    isLoading && "opacity-50 cursor-not-allowed",
                  )}
                >
                  Decline
                </button>
                <button
                  onClick={() => void onAccept(invitation.id)}
                  disabled={isLoading}
                  className={twMerge(
                    "px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95",
                    isLoading && "opacity-50 cursor-not-allowed hover:scale-100",
                  )}
                >
                  {isLoading ? "Accepting..." : "Accept"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-4 text-center">Or create your own organization</p>
        <button
          onClick={onSkip}
          disabled={isLoading}
          className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        >
          Create New Organization
        </button>
      </div>
    </motion.div>
  );
}

function PlanStep({
  plans,
  currentPlan,
  onSelectPlan,
  isLoading,
}: {
  plans: SubscriptionPlan[];
  currentPlan: CurrentSubscription | null;
  onSelectPlan: (planId: string | null, seats: number) => Promise<void>;
  isLoading: boolean;
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);

  const isFree = currentPlan?.planSlug === "free";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-8 shadow-lg"
    >
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg shadow-safee-500/50 mb-6">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        {currentPlan ? (
          <p className="text-gray-600">
            You&apos;re currently on the{" "}
            <span className="font-semibold text-safee-600">{currentPlan.planName}</span> plan
            {isFree && " - Upgrade now or continue with Free"}
          </p>
        ) : (
          <p className="text-gray-600">Select a plan to get started with Safee Analytics</p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrentPlan = plan.slug === currentPlan?.planSlug;
          const isSelected = selectedPlanId === plan.id;
          const price = parseFloat(plan.pricePerSeat);

          return (
            <button
              key={plan.id}
              onClick={() => {
                setSelectedPlanId(plan.id);
                setSeats(plan.maxSeats === 1 ? 1 : seats);
              }}
              className={twMerge(
                "relative p-6 rounded-xl border-2 text-left transition-all",
                isCurrentPlan && !isSelected && "border-green-500 bg-green-50",
                isSelected && "border-safee-500 bg-safee-50 shadow-lg shadow-safee-500/20",
                !isCurrentPlan && !isSelected && "border-gray-200 bg-white hover:border-safee-300",
              )}
            >
              {isCurrentPlan && !isSelected && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 rounded-full bg-green-600 text-white text-xs font-semibold">
                    Current
                  </span>
                </div>
              )}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-safee-500" />
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">${price}</span>
                <span className="text-gray-600">/seat/month</span>
              </div>

              <div className="space-y-2 mb-4">
                {plan.maxSeats && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Up to {plan.maxSeats} seats</span>
                  </p>
                )}
                {!plan.maxSeats && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Unlimited seats</span>
                  </p>
                )}
              </div>

              {/* Seat selector for non-free plans */}
              {isSelected && plan.maxSeats !== 1 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of seats</label>
                  <input
                    type="number"
                    min="1"
                    max={plan.maxSeats || 100}
                    value={seats}
                    onChange={(e) => {
                      setSeats(Math.max(1, parseInt(e.target.value) || 1));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-safee-500"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        {isFree && (
          <button
            onClick={() => {
              void onSelectPlan(null, 1);
            }}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Continue with Free
          </button>
        )}
        <button
          onClick={() => {
            if (selectedPlanId) {
              void onSelectPlan(selectedPlanId, seats);
            }
          }}
          disabled={!selectedPlanId || isLoading}
          className={twMerge(
            "flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all",
            (!selectedPlanId || isLoading) && "opacity-50 cursor-not-allowed",
          )}
        >
          {isLoading ? "Processing..." : selectedPlanId ? "Continue with Selected Plan" : "Select a Plan"}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}

function OrganizationStep({
  organizationName,
  industry,
  onNameChange,
  onIndustryChange,
  onNext,
  onBack,
  canProceed,
}: {
  organizationName: string;
  industry: string;
  onNameChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-8 shadow-lg"
    >
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-safee-500 to-safee-700 flex items-center justify-center shadow-lg shadow-safee-500/50 mb-6">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Let&apos;s create your organization</h1>
        <p className="text-gray-600">This will be your workspace where your team collaborates</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="org-name" className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            value={organizationName}
            onChange={(e) => {
              onNameChange(e.target.value);
            }}
            placeholder="Acme Inc."
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 ring-1 ring-transparent transition-all focus:outline-0 focus:ring-2 focus:ring-safee-500 focus:border-safee-500"
            required
          />
        </div>

        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry (Optional)
          </label>
          <select
            id="industry"
            value={industry}
            onChange={(e) => {
              onIndustryChange(e.target.value);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 ring-1 ring-transparent transition-all focus:outline-0 focus:ring-2 focus:ring-safee-500 focus:border-safee-500"
          >
            <option value="">Select an industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="consulting">Consulting</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={twMerge(
            "flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95",
            !canProceed && "opacity-50 cursor-not-allowed hover:scale-100",
          )}
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function TeamStep({
  teamMembers,
  newMemberEmail,
  onNewMemberEmailChange,
  onAddMember,
  onRemoveMember,
  onNext,
  onBack,
}: {
  teamMembers: TeamMember[];
  newMemberEmail: string;
  onNewMemberEmailChange: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (email: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-8 shadow-lg"
    >
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/50 mb-6">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite your team</h1>
        <p className="text-gray-600">Add team members to collaborate (you can skip this for now)</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="flex gap-2">
            <input
              id="member-email"
              type="email"
              value={newMemberEmail}
              onChange={(e) => {
                onNewMemberEmailChange(e.target.value);
              }}
              onKeyPress={(e) => e.key === "Enter" && onAddMember()}
              placeholder="colleague@company.com"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 ring-1 ring-transparent transition-all focus:outline-0 focus:ring-2 focus:ring-safee-500 focus:border-safee-500"
            />
            <button
              onClick={onAddMember}
              disabled={!newMemberEmail}
              className="px-4 py-3 rounded-lg bg-safee-500 text-white hover:bg-safee-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {teamMembers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Team Members ({teamMembers.length})</p>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-safee-400 to-safee-600 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onRemoveMember(member.email);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {teamMembers.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No team members added yet</p>
            <p className="text-xs text-gray-500 mt-1">You can add them later from settings</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold transition-all hover:bg-gray-50 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function ModulesStep({
  selectedModules,
  onToggleModule,
  onNext,
  onBack,
  isLoading,
  canProceed,
}: {
  selectedModules: string[];
  onToggleModule: (moduleId: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  canProceed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-2xl p-8 shadow-lg"
    >
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/50 mb-6">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose your modules</h1>
        <p className="text-gray-600">Select the features you need (you can change this later)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {AVAILABLE_MODULES.map((module) => {
          const Icon = module.icon;
          const isSelected = selectedModules.includes(module.id);

          return (
            <button
              key={module.id}
              onClick={() => {
                onToggleModule(module.id);
              }}
              className={twMerge(
                "relative p-6 rounded-xl border-2 text-left transition-all hover:scale-105 active:scale-95",
                isSelected
                  ? "border-safee-500 bg-safee-50 shadow-lg shadow-safee-500/20"
                  : "border-gray-200 bg-white hover:border-safee-300",
              )}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <CheckCircle2 className="w-6 h-6 text-safee-500" />
                </div>
              )}
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
              <p className="text-sm text-gray-600">{module.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className={twMerge(
            "flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95",
            (!canProceed || isLoading) && "opacity-50 cursor-not-allowed hover:scale-100",
          )}
        >
          {isLoading ? "Creating..." : "Complete Setup"}
          {!isLoading && <CheckCircle2 className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}

function CompleteStep({ organizationName }: { organizationName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl p-12 shadow-lg text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50"
      >
        <CheckCircle2 className="w-12 h-12 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl font-bold text-gray-900 mb-3"
      >
        Welcome to {organizationName}!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 mb-6"
      >
        Your workspace is ready. Redirecting you to your dashboard...
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex justify-center"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safee-500"></div>
      </motion.div>
    </motion.div>
  );
}

// Logo component
const SafeeLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <SafeeLogoComponent size="lg" />
    </div>
  );
};
