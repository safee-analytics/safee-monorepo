"use client";

import { useState, useEffect, startTransition } from "react";
import { Plus, Save, CheckCircle, X, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  useAuditPlan,
  useCreateAuditPlan,
  useUpdateAuditPlan,
  type CreateAuditPlanRequest,
  type UpdateAuditPlanRequest,
} from "@/lib/api/hooks/auditPlanning";
import { AISuggestions } from "@/components/audit/planning/AISuggestions";

interface Objective {
  id: string;
  description: string;
  priority?: string;
}

interface TeamMember {
  userId: string;
  name: string;
  role: string;
  hours?: number;
}

interface PhaseBreakdown {
  name: string;
  duration: number;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export default function AuditPlanning() {
  const searchParams = useSearchParams();
  const planId = searchParams?.get("planId");

  // Fetch existing plan if planId is provided
  const { data: existingPlan, isLoading: isLoadingPlan } = useAuditPlan(planId || "");
  const createMutation = useCreateAuditPlan();
  const updateMutation = useUpdateAuditPlan();

  const [title, setTitle] = useState("New Audit Plan");
  const [clientName, setClientName] = useState("");
  const [auditType, setAuditType] = useState<string>("financial_audit");
  const [auditYear, setAuditYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [targetCompletion, setTargetCompletion] = useState("");
  const [materialityThreshold, setMaterialityThreshold] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [totalHours, setTotalHours] = useState(480);
  const [status, setStatus] = useState<"draft" | "in_review" | "approved">("draft");

  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: "1",
      description: "Verify the accuracy and completeness of financial statements",
      priority: "high",
    },
    {
      id: "2",
      description: "Evaluate the effectiveness of internal control systems",
      priority: "high",
    },
    {
      id: "3",
      description: "Ensure compliance with regulatory requirements",
      priority: "medium",
    },
  ]);

  const [businessUnits, setBusinessUnits] = useState({
    headquarters: true,
    manufacturing: true,
    salesMarketing: false,
    itDepartment: true,
  });

  const [financialAreas, setFinancialAreas] = useState({
    revenue: true,
    assets: true,
    cashFlow: true,
    expenses: false,
    liabilities: false,
    equity: false,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [phaseBreakdown, setPhaseBreakdown] = useState<PhaseBreakdown[]>([
    { name: "Planning", duration: 96, description: "Initial planning and risk assessment" },
    { name: "Fieldwork", duration: 288, description: "Evidence gathering and testing" },
    { name: "Reporting", duration: 96, description: "Findings documentation and reporting" },
  ]);

  // Load existing plan data when it's available
  useEffect(() => {
    if (existingPlan) {
      startTransition(() => {
        setTitle(existingPlan.title);
        setClientName(existingPlan.clientName || "");
        setAuditType(existingPlan.auditType || "financial_audit");
        setAuditYear(existingPlan.auditYear || new Date().getFullYear());
        setStartDate(existingPlan.startDate || "");
        setTargetCompletion(existingPlan.targetCompletion || "");
        setMaterialityThreshold(existingPlan.materialityThreshold || "");
        setTotalBudget(existingPlan.totalBudget || "");
        setTotalHours(existingPlan.totalHours || 480);
        setStatus(existingPlan.status as "draft" | "in_review" | "approved");

        if (existingPlan.objectives) {
          setObjectives(existingPlan.objectives);
        }
        if (existingPlan.businessUnits) {
          setBusinessUnits(existingPlan.businessUnits as typeof businessUnits);
        }
        if (existingPlan.financialAreas) {
          setFinancialAreas(existingPlan.financialAreas as typeof financialAreas);
        }
        if (existingPlan.teamMembers) {
          setTeamMembers(existingPlan.teamMembers);
        }
        if (existingPlan.phaseBreakdown) {
          setPhaseBreakdown(existingPlan.phaseBreakdown);
        }
      });
    }
  }, [existingPlan]);

  const addObjective = () => {
    const newObjective: Objective = {
      id: String(Date.now()),
      description: "New Objective",
      priority: "medium",
    };
    setObjectives([...objectives, newObjective]);
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((obj) => obj.id !== id));
  };

  const handleSaveDraft = async () => {
    const planData = {
      title,
      clientName,
      auditType: auditType as CreateAuditPlanRequest["auditType"],
      auditYear,
      startDate: startDate || undefined,
      targetCompletion: targetCompletion || undefined,
      objectives,
      businessUnits,
      financialAreas,
      teamMembers,
      phaseBreakdown,
      totalBudget: totalBudget || undefined,
      totalHours,
      materialityThreshold: materialityThreshold || undefined,
      status: "draft" as const,
    };

    try {
      if (planId && existingPlan) {
        await updateMutation.mutateAsync({
          planId,
          request: planData as UpdateAuditPlanRequest,
        });
      } else {
        await createMutation.mutateAsync(planData);
      }
    } catch (err) {
      console.error("Failed to save plan:", err);
    }
  };

  const handleFinalizePlan = async () => {
    const planData = {
      title,
      clientName,
      auditType: auditType as CreateAuditPlanRequest["auditType"],
      auditYear,
      startDate: startDate || undefined,
      targetCompletion: targetCompletion || undefined,
      objectives,
      businessUnits,
      financialAreas,
      teamMembers,
      phaseBreakdown,
      totalBudget: totalBudget || undefined,
      totalHours,
      materialityThreshold: materialityThreshold || undefined,
      status: "approved" as const,
    };

    try {
      if (planId && existingPlan) {
        await updateMutation.mutateAsync({
          planId,
          request: planData as UpdateAuditPlanRequest,
        });
      } else {
        await createMutation.mutateAsync(planData);
      }
    } catch (err) {
      console.error("Failed to finalize plan:", err);
    }
  };

  const handleApplyTeamSuggestion = (members: TeamMember[]) => {
    setTeamMembers(members);
  };

  const handleApplyBudgetSuggestion = (budget: string, hours: number) => {
    setTotalBudget(budget);
    setTotalHours(hours);
  };

  const handleApplyRiskSuggestion = (risks: { type: string; severity: string; message: string }[]) => {
    // Store risks in state - could be added to the plan data structure
    console.warn("Applied risk suggestions:", risks);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (planId && isLoadingPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading audit plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Planning</h1>
            <p className="text-gray-600">
              Define objectives, scope, and allocate resources for your audit engagement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                void handleSaveDraft();
              }}
              disabled={isSaving}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
            <button
              onClick={() => {
                void handleFinalizePlan();
              }}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4" />
              Finalize Plan
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
              status === "draft"
                ? "bg-blue-100 text-blue-700"
                : status === "in_review"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === "draft" ? "bg-blue-600" : status === "in_review" ? "bg-yellow-600" : "bg-green-600"
              }`}
            />
            {status === "draft" ? "Draft" : status === "in_review" ? "In Review" : "Approved"}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Audit Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Audit Overview</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type</label>
                    <select
                      value={auditType}
                      onChange={(e) => {
                        setAuditType(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="financial_audit">Financial Audit</option>
                      <option value="compliance_audit">Compliance Audit</option>
                      <option value="operational_audit">Operational Audit</option>
                      <option value="it_audit">IT Audit</option>
                      <option value="internal_controls">Internal Controls</option>
                      <option value="risk_assessment">Risk Assessment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audit Year</label>
                    <select
                      value={auditYear}
                      onChange={(e) => {
                        setAuditYear(parseInt(e.target.value));
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Completion</label>
                    <input
                      type="date"
                      value={targetCompletion}
                      onChange={(e) => {
                        setTargetCompletion(e.target.value);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Objectives */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Audit Objectives</h2>
                <button
                  onClick={addObjective}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add New Objective
                </button>
              </div>

              <div className="space-y-3">
                {objectives.map((objective, idx) => (
                  <div
                    key={objective.id}
                    className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={objective.description}
                        onChange={(e) => {
                          const newObjectives = [...objectives];
                          newObjectives[idx].description = e.target.value;
                          setObjectives(newObjectives);
                        }}
                        className="w-full text-sm font-semibold text-gray-900 mb-1 border-0 border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-blue-500 px-0"
                      />
                      <select
                        value={objective.priority || "medium"}
                        onChange={(e) => {
                          const newObjectives = [...objectives];
                          newObjectives[idx].priority = e.target.value;
                          setObjectives(newObjectives);
                        }}
                        className="text-xs text-gray-600 border-0 px-0 focus:outline-none"
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        removeObjective(objective.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Scope */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Audit Scope</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Business Units</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.headquarters}
                        onChange={(e) => {
                          setBusinessUnits({ ...businessUnits, headquarters: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Corporate Headquarters</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.manufacturing}
                        onChange={(e) => {
                          setBusinessUnits({ ...businessUnits, manufacturing: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Manufacturing Division</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.salesMarketing}
                        onChange={(e) => {
                          setBusinessUnits({ ...businessUnits, salesMarketing: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Sales & Marketing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.itDepartment}
                        onChange={(e) => {
                          setBusinessUnits({ ...businessUnits, itDepartment: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">IT Department</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Financial Areas</h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.revenue}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, revenue: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Revenue</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.assets}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, assets: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Assets</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.cashFlow}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, cashFlow: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Cash Flow</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.expenses}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, expenses: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Expenses</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.liabilities}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, liabilities: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Liabilities</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.equity}
                        onChange={(e) => {
                          setFinancialAreas({ ...financialAreas, equity: e.target.checked });
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Equity</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Materiality Threshold</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">$</span>
                    <input
                      type="number"
                      value={materialityThreshold}
                      onChange={(e) => {
                        setMaterialityThreshold(e.target.value);
                      }}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-600">USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Allocation */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Resource Allocation</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Assignment */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Assignment</h3>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{member.hours || 0}h</p>
                          <p className="text-xs text-gray-600">Allocated</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Team Member
                    </button>
                  </div>
                </div>

                {/* Budget & Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Budget & Timeline</h3>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Total Budget</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">$</span>
                          <input
                            type="number"
                            value={totalBudget}
                            onChange={(e) => {
                              setTotalBudget(e.target.value);
                            }}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Total Hours</label>
                        <input
                          type="number"
                          value={totalHours}
                          onChange={(e) => {
                            setTotalHours(parseInt(e.target.value) || 0);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-3">Phase Breakdown</h4>
                    <div className="space-y-3">
                      {phaseBreakdown.map((phase, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700">{phase.name}</span>
                            <span className="text-sm font-medium text-gray-900">{phase.duration}h</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                              style={{ width: `${(phase.duration / totalHours) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h2>
              <p className="text-sm text-gray-600">
                Risk assessment section will be completed after initial planning.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Suggestions */}
            <AISuggestions
              clientName={clientName}
              auditType={auditType}
              auditYear={auditYear}
              totalBudget={totalBudget}
              totalHours={totalHours}
              onApplyTeamSuggestion={handleApplyTeamSuggestion}
              onApplyBudgetSuggestion={handleApplyBudgetSuggestion}
              onApplyRiskSuggestion={handleApplyRiskSuggestion}
            />

            {/* Plan Summary */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Plan Summary</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Objectives</span>
                  <span className="text-sm font-bold text-gray-900">{objectives.length}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Hours</span>
                  <span className="text-sm font-bold text-gray-900">{totalHours}h</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="text-sm font-bold text-gray-900">
                    {totalBudget ? `$${totalBudget}` : "Not set"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Team Members</span>
                  <span className="text-sm font-bold text-gray-900">{teamMembers.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
