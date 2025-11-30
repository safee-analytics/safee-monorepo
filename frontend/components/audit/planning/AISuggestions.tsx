"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Users, DollarSign, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface AISuggestionsProps {
  clientName?: string;
  auditType?: string;
  auditYear?: number;
  totalBudget?: string;
  totalHours?: number;
  onApplyTeamSuggestion?: (members: Array<{ userId: string; name: string; role: string; hours?: number }>) => void;
  onApplyBudgetSuggestion?: (budget: string, hours: number) => void;
  onApplyRiskSuggestion?: (risks: Array<{ type: string; severity: string; message: string }>) => void;
}

export function AISuggestions({
  clientName: _clientName,
  auditType: _auditType,
  auditYear: _auditYear,
  totalBudget: _totalBudget,
  totalHours: _totalHours,
  onApplyTeamSuggestion,
  onApplyBudgetSuggestion,
  onApplyRiskSuggestion,
}: AISuggestionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"team" | "budget" | "risks">("team");

  // Mock AI suggestions - in production, these would come from an AI API
  const teamSuggestions = [
    { userId: "ai-1", name: "Senior Auditor", role: "Lead Auditor", hours: 120 },
    { userId: "ai-2", name: "Financial Analyst", role: "Senior Auditor", hours: 160 },
    { userId: "ai-3", name: "Compliance Specialist", role: "Junior Auditor", hours: 120 },
    { userId: "ai-4", name: "IT Audit Specialist", role: "Technical Auditor", hours: 80 },
  ];

  const budgetSuggestion = {
    totalBudget: "95000",
    totalHours: 480,
    breakdown: [
      { category: "Personnel", amount: "$72,000", percentage: 76 },
      { category: "Travel & Expenses", amount: "$12,000", percentage: 13 },
      { category: "Software & Tools", amount: "$8,000", percentage: 8 },
      { category: "Contingency", amount: "$3,000", percentage: 3 },
    ],
  };

  const riskSuggestions = [
    {
      type: "Regulatory Compliance",
      severity: "high",
      message: "Recent changes to financial reporting standards may impact audit procedures",
    },
    {
      type: "Data Quality",
      severity: "medium",
      message: "Multiple legacy systems may present data integration challenges",
    },
    {
      type: "Resource Availability",
      severity: "medium",
      message: "Peak audit season may affect specialist availability",
    },
    {
      type: "Client Cooperation",
      severity: "low",
      message: "New client engagement may require additional documentation requests",
    },
  ];

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
  };

  const handleApplyTeam = () => {
    onApplyTeamSuggestion?.(teamSuggestions);
  };

  const handleApplyBudget = () => {
    onApplyBudgetSuggestion?.(budgetSuggestion.totalBudget, budgetSuggestion.totalHours);
  };

  const handleApplyRisks = () => {
    onApplyRiskSuggestion?.(riskSuggestions);
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-purple-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI Suggestions</h3>
              <p className="text-xs text-gray-600">Powered by AI analytics</p>
            </div>
          </div>
          <button className="p-1 hover:bg-white rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Generate Button */}
          {!isGenerating && (
            <button
              onClick={handleGenerateSuggestions}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Generate AI Suggestions
            </button>
          )}

          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-sm text-gray-600">Analyzing audit requirements...</p>
              </div>
            </div>
          )}

          {!isGenerating && (
            <>
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-lg">
                <button
                  onClick={() => setActiveTab("team")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "team"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-1" />
                  Team
                </button>
                <button
                  onClick={() => setActiveTab("budget")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "budget"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Budget
                </button>
                <button
                  onClick={() => setActiveTab("risks")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "risks"
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Risks
                </button>
              </div>

              {/* Tab Content */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                {activeTab === "team" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Recommended team composition based on audit scope</p>
                      <button
                        onClick={handleApplyTeam}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs rounded-lg transition-all"
                      >
                        Apply All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {teamSuggestions.map((member, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                            {member.name.substring(0, 2)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-600">{member.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-purple-600">{member.hours}h</p>
                            <p className="text-xs text-gray-600">Recommended</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "budget" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Estimated budget based on industry benchmarks</p>
                      <button
                        onClick={handleApplyBudget}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs rounded-lg transition-all"
                      >
                        Apply Budget
                      </button>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">${budgetSuggestion.totalBudget}</span>
                        <span className="text-sm text-gray-600">total budget</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>{budgetSuggestion.totalHours} hours estimated</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Budget Breakdown</p>
                      {budgetSuggestion.breakdown.map((item, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{item.category}</span>
                            <span className="text-sm font-medium text-gray-900">{item.amount}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "risks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">Identified potential risks for this audit</p>
                      <button
                        onClick={handleApplyRisks}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs rounded-lg transition-all"
                      >
                        Add to Plan
                      </button>
                    </div>

                    <div className="space-y-2">
                      {riskSuggestions.map((risk, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                risk.severity === "high"
                                  ? "bg-red-100"
                                  : risk.severity === "medium"
                                    ? "bg-yellow-100"
                                    : "bg-green-100"
                              }`}
                            >
                              <AlertTriangle
                                className={`w-4 h-4 ${
                                  risk.severity === "high"
                                    ? "text-red-600"
                                    : risk.severity === "medium"
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-gray-900">{risk.type}</p>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                                    risk.severity === "high"
                                      ? "bg-red-100 text-red-700"
                                      : risk.severity === "medium"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {risk.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{risk.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Disclaimer */}
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-gray-600 text-center">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  AI suggestions are based on historical data and industry standards. Review and adjust as needed.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
