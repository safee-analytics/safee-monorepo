"use client";

import { useState } from "react";
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
import { SafeeLogo as SafeeLogoComponent } from "@/components/common/SafeeLogo";

// Multi-step onboarding types
type OnboardingStep = "organization" | "team" | "modules" | "complete";

interface TeamMember {
  email: string;
  role: "admin" | "user";
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AVAILABLE_MODULES: Module[] = [
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
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("organization");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization step
  const [organizationName, setOrganizationName] = useState("");
  const [organizationSlug, setOrganizationSlug] = useState("");
  const [industry, setIndustry] = useState("");

  // Team step
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Modules step
  const [selectedModules, setSelectedModules] = useState<string[]>(["accounting"]);

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
      setTeamMembers([...teamMembers, { email: newMemberEmail, role: "user" }]);
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

  // Create organization after Step 1 - check slug availability first
  const handleCreateOrganization = async () => {
    if (!organizationName || !organizationSlug) {
      setError("Please fill in all required fields");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Get the next available slug in one API call
      const { data: slugData, error: slugError } = await apiClient.GET("/organizations/slugs/next", {
        params: { query: { baseSlug: organizationSlug } },
      });

      if (slugError || !slugData) {
        throw new Error("Failed to generate unique slug");
      }

      // Create organization with available slug
      const response = await authClient.organization.create({
        name: organizationName,
        slug: slugData.nextSlug,
        metadata: {
          industry,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create organization");
      }

      // Update slug state with the final used slug
      setOrganizationSlug(slugData.nextSlug);

      // Move to next step after organization is created
      setCurrentStep("team");
    } catch (err) {
      console.error("Organization creation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setIsLoading(false);
    }
  };

  // Complete onboarding and redirect to dashboard
  const handleCompleteOnboarding = async () => {
    setIsLoading(true);

    try {
      // TODO: Update organization with selected modules and team members
      // This would be a separate API call to update the organization metadata

      setCurrentStep("complete");

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate between steps
  const goToNextStep = () => {
    if (currentStep === "organization") {
      void handleCreateOrganization();
    } else if (currentStep === "team") {
      setCurrentStep("modules");
    } else if (currentStep === "modules") {
      void handleCompleteOnboarding();
    }
  };

  const goToPreviousStep = () => {
    // Don't allow going back to organization step once created
    if (currentStep === "modules") setCurrentStep("team");
  };

  const canProceed = (): boolean => {
    if (currentStep === "organization") return !!(organizationName && organizationSlug);
    if (currentStep === "team") return true; // Team is optional
    if (currentStep === "modules") return selectedModules.length > 0;
    return false;
  };

  const steps: { id: OnboardingStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
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
          {currentStep === "organization" && (
            <OrganizationStep
              key="organization"
              organizationName={organizationName}
              industry={industry}
              onNameChange={handleNameChange}
              onIndustryChange={setIndustry}
              onNext={goToNextStep}
              canProceed={canProceed()}
              isLoading={isLoading}
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
function OrganizationStep({
  organizationName,
  industry,
  onNameChange,
  onIndustryChange,
  onNext,
  canProceed,
  isLoading,
}: {
  organizationName: string;
  industry: string;
  onNameChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onNext: () => void;
  canProceed: boolean;
  isLoading: boolean;
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

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed || isLoading}
          className={twMerge(
            "flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-br from-safee-400 to-safee-700 text-white font-semibold transition-all hover:scale-105 active:scale-95",
            (!canProceed || isLoading) && "opacity-50 cursor-not-allowed hover:scale-100",
          )}
        >
          {isLoading ? "Creating Organization..." : "Create & Continue"}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
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
}: {
  teamMembers: TeamMember[];
  newMemberEmail: string;
  onNewMemberEmailChange: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (email: string) => void;
  onNext: () => void;
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

      <div className="mt-8 flex justify-end">
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
