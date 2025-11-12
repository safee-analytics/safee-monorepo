"use client";

import { useState } from "react";
import { Plus, Save, CheckCircle, Edit2, X } from "lucide-react";

interface Objective {
  id: string;
  title: string;
  description: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  hoursAllocated: number;
}

export default function AuditPlanning() {
  const [clientName, setClientName] = useState("ABC Corporation Ltd.");
  const [auditType, setAuditType] = useState("financial");
  const [auditYear, setAuditYear] = useState("2024");
  const [startDate, setStartDate] = useState("2024-01-15");
  const [targetCompletion, setTargetCompletion] = useState("2024-03-31");
  const [materialityThreshold, setMaterialityThreshold] = useState("50000");
  const [totalBudget, setTotalBudget] = useState("85000");
  const [totalHours, setTotalHours] = useState("480");

  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: "1",
      title: "Financial Statement Accuracy",
      description: "Verify the accuracy and completeness of financial statements",
    },
    {
      id: "2",
      title: "Internal Controls Assessment",
      description: "Evaluate the effectiveness of internal control systems",
    },
    {
      id: "3",
      title: "Compliance Verification",
      description: "Ensure compliance with regulatory requirements",
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

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "Sarah Wilson",
      role: "Audit Manager",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      hoursAllocated: 120,
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "Senior Auditor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      hoursAllocated: 200,
    },
    {
      id: "3",
      name: "Emma Rodriguez",
      role: "Junior Auditor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      hoursAllocated: 160,
    },
  ]);

  const [phaseBreakdown] = useState([
    { name: "Planning", hours: 96, color: "bg-blue-500" },
    { name: "Fieldwork", hours: 288, color: "bg-yellow-500" },
    { name: "Reporting", hours: 96, color: "bg-green-500" },
  ]);

  const keyMetrics = {
    revenue: "$125M",
    employees: 450,
    locations: 12,
    riskLevel: "Medium",
  };

  const addObjective = () => {
    const newObjective: Objective = {
      id: String(objectives.length + 1),
      title: "New Objective",
      description: "Description here",
    };
    setObjectives([...objectives, newObjective]);
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((obj) => obj.id !== id));
  };

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
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <CheckCircle className="w-4 h-4" />
              Finalize Plan
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            <span className="w-2 h-2 bg-blue-600 rounded-full" />
            Planning Phase
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audit Type</label>
                    <select
                      value={auditType}
                      onChange={(e) => setAuditType(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="financial">Financial Audit</option>
                      <option value="compliance">Compliance Audit</option>
                      <option value="operational">Operational Audit</option>
                      <option value="risk">Risk Assessment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Audit Year</label>
                    <select
                      value={auditYear}
                      onChange={(e) => setAuditYear(e.target.value)}
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
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Completion</label>
                    <input
                      type="date"
                      value={targetCompletion}
                      onChange={(e) => setTargetCompletion(e.target.value)}
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
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">{objective.title}</h3>
                      <p className="text-xs text-gray-600">{objective.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => removeObjective(objective.id)}
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
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
                        onChange={(e) =>
                          setBusinessUnits({ ...businessUnits, headquarters: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Corporate Headquarters</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.manufacturing}
                        onChange={(e) =>
                          setBusinessUnits({ ...businessUnits, manufacturing: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Manufacturing Division</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.salesMarketing}
                        onChange={(e) =>
                          setBusinessUnits({ ...businessUnits, salesMarketing: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Sales & Marketing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={businessUnits.itDepartment}
                        onChange={(e) =>
                          setBusinessUnits({ ...businessUnits, itDepartment: e.target.checked })
                        }
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
                        onChange={(e) => setFinancialAreas({ ...financialAreas, revenue: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Revenue</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.assets}
                        onChange={(e) => setFinancialAreas({ ...financialAreas, assets: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Assets</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.cashFlow}
                        onChange={(e) => setFinancialAreas({ ...financialAreas, cashFlow: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Cash Flow</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.expenses}
                        onChange={(e) => setFinancialAreas({ ...financialAreas, expenses: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Expenses</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.liabilities}
                        onChange={(e) =>
                          setFinancialAreas({ ...financialAreas, liabilities: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Liabilities</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={financialAreas.equity}
                        onChange={(e) => setFinancialAreas({ ...financialAreas, equity: e.target.checked })}
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
                      onChange={(e) => setMaterialityThreshold(e.target.value)}
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
                        key={member.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                      >
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{member.hoursAllocated}h</p>
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
                            onChange={(e) => setTotalBudget(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Total Hours</label>
                        <input
                          type="number"
                          value={totalHours}
                          onChange={(e) => setTotalHours(e.target.value)}
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
                            <span className="text-sm font-medium text-gray-900">{phase.hours}h</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${phase.color}`}
                              style={{ width: `${(phase.hours / parseInt(totalHours)) * 100}%` }}
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

          {/* Sidebar - Key Metrics */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Metrics</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-bold text-gray-900">{keyMetrics.revenue}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Employees</span>
                  <span className="text-sm font-bold text-gray-900">{keyMetrics.employees}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200">
                  <span className="text-sm text-gray-600">Locations</span>
                  <span className="text-sm font-bold text-gray-900">{keyMetrics.locations}</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-gray-600">Risk Level</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">
                    {keyMetrics.riskLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
