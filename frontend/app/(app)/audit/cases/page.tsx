"use client";

import { useState } from "react";
import { FileText, Clock, CheckCircle, AlertTriangle, List, LayoutGrid, Download } from "lucide-react";
import { StatCard } from "@/components/audit/ui/StatCard";
import { StatusBadge } from "@/components/audit/ui/StatusBadge";
import { PriorityBadge } from "@/components/audit/ui/PriorityBadge";
import { CaseStatus, CasePriority } from "@/types/audit";

interface CaseRow {
  id: string;
  caseId: string;
  auditType: string;
  companyName: string;
  industry: string;
  assignee: {
    name: string;
    avatar: string;
  };
  status: CaseStatus;
  priority: CasePriority;
  dueDate: string;
  progress: number;
  icon: string;
  iconBg: string;
}

export default function CaseManagement() {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("");

  const stats = {
    totalCases: 47,
    activeCases: 24,
    completedCases: 18,
    overdueCases: 5,
  };

  const cases: CaseRow[] = [
    {
      id: "1",
      caseId: "CASE-001",
      auditType: "Annual Financial Audit",
      companyName: "ABC Corporation",
      industry: "Technology",
      assignee: {
        name: "Michael Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      },
      status: "in-progress",
      priority: "high",
      dueDate: "Dec 15, 2024",
      progress: 65,
      icon: "📊",
      iconBg: "bg-blue-100",
    },
    {
      id: "2",
      caseId: "CASE-002",
      auditType: "Inventory Audit",
      companyName: "XYZ Retail Ltd",
      industry: "Retail",
      assignee: {
        name: "Emma Rodriguez",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
      status: "completed",
      priority: "medium",
      dueDate: "Dec 10, 2024",
      progress: 100,
      icon: "🏪",
      iconBg: "bg-green-100",
    },
    {
      id: "3",
      caseId: "CASE-003",
      auditType: "Compliance Audit",
      companyName: "Manufacturing Co",
      industry: "Manufacturing",
      assignee: {
        name: "David Kim",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      },
      status: "overdue",
      priority: "high",
      dueDate: "Dec 8, 2024",
      progress: 45,
      icon: "🏭",
      iconBg: "bg-red-100",
    },
    {
      id: "4",
      caseId: "CASE-004",
      auditType: "Risk Assessment",
      companyName: "Financial Services Inc",
      industry: "Finance",
      assignee: {
        name: "Lisa Thompson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      },
      status: "in-review",
      priority: "medium",
      dueDate: "Dec 20, 2024",
      progress: 80,
      icon: "🏦",
      iconBg: "bg-yellow-100",
    },
  ];

  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases((prev) =>
      prev.includes(caseId) ? prev.filter((id) => id !== caseId) : [...prev, caseId],
    );
  };

  const toggleAllCases = () => {
    if (selectedCases.length === cases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(cases.map((c) => c.id));
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setDueDateFilter("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Management</h1>
            <p className="text-gray-600">
              Manage all your audit cases, track progress, and monitor deadlines.
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <span className="text-lg">+</span>
            New Case
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-4">
          <button className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors">
            All Cases
          </button>
          <button className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors">
            Active
          </button>
          <button className="px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-white transition-colors">
            Completed
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Cases"
            value={stats.totalCases}
            icon={FileText}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Active"
            value={stats.activeCases}
            icon={Clock}
            iconBgColor="bg-yellow-100"
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Completed"
            value={stats.completedCases}
            icon={CheckCircle}
            iconBgColor="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueCases}
            icon={AlertTriangle}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">All Status</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="in-review">In Review</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Assignee:</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">All Team Members</option>
                <option value="michael">Michael Chen</option>
                <option value="emma">Emma Rodriguez</option>
                <option value="david">David Kim</option>
                <option value="lisa">Lisa Thompson</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Due Date:</label>
              <input
                type="date"
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                placeholder="mm/dd/yyyy"
              />
            </div>

            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">All Cases</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <List className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <LayoutGrid className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCases.length === cases.length}
                      onChange={toggleAllCases}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Case Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cases.map((caseRow) => (
                  <tr key={caseRow.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedCases.includes(caseRow.id)}
                        onChange={() => toggleCaseSelection(caseRow.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${caseRow.iconBg}`}
                        >
                          {caseRow.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{caseRow.caseId}</p>
                          <p className="text-xs text-gray-600">{caseRow.auditType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{caseRow.companyName}</p>
                        <p className="text-xs text-gray-600">{caseRow.industry}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={caseRow.assignee.avatar}
                          alt={caseRow.assignee.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <span className="text-sm text-gray-900">{caseRow.assignee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={caseRow.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={caseRow.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${caseRow.status === "overdue" ? "text-red-600 font-medium" : "text-gray-900"}`}
                      >
                        {caseRow.dueDate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              caseRow.status === "completed"
                                ? "bg-green-500"
                                : caseRow.status === "overdue"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                            }`}
                            style={{ width: `${caseRow.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
