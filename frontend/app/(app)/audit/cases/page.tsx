"use client";

import { useState, useMemo } from "react";
import { useCases } from "@/lib/api/hooks";
import { CaseStats } from "@/components/audit/cases/CaseStats";
import { CaseFilters } from "@/components/audit/cases/CaseFilters";
import { CaseTable, type CaseRow } from "@/components/audit/cases/CaseTable";
import { CreateCaseModal } from "@/components/audit/cases/CreateCaseModal";
import type { components } from "@/lib/api/types";

type CaseStatus = components["schemas"]["CaseResponse"]["status"];
type CasePriority = components["schemas"]["CaseResponse"]["priority"];

export default function CaseManagement() {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<CasePriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dueDateFilter, setDueDateFilter] = useState("");

  // Fetch all cases from API (no filters on API call)
  const { data: apiCases, isLoading, refetch } = useCases();

  // Map API cases to CaseRow format, apply client-side filters, and calculate stats
  const { cases, stats } = useMemo(() => {
    let mappedCases: CaseRow[] = (apiCases ?? []).map((caseData) => ({
      id: caseData.id,
      caseId: caseData.caseNumber,
      auditType: caseData.auditType,
      companyName: caseData.clientName,
      industry: "General",
      assignee: {
        name: caseData.createdBy,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${caseData.createdBy}`,
      },
      status: caseData.status,
      priority: caseData.priority,
      dueDate: caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : "N/A",
      progress:
        caseData.status === "completed"
          ? 100
          : caseData.status === "under-review"
            ? 80
            : caseData.status === "in-progress"
              ? 50
              : 10,
      icon: "📋",
      iconBg: "bg-blue-100",
    }));

    // Apply client-side filters
    if (statusFilter !== "all") {
      mappedCases = mappedCases.filter((c) => c.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      mappedCases = mappedCases.filter((c) => c.priority === priorityFilter);
    }
    if (assigneeFilter !== "all") {
      mappedCases = mappedCases.filter((c) =>
        c.assignee.name.toLowerCase().includes(assigneeFilter.toLowerCase()),
      );
    }
    if (dueDateFilter) {
      mappedCases = mappedCases.filter((c) => c.dueDate === dueDateFilter);
    }

    const calculatedStats = {
      totalCases: mappedCases.length,
      activeCases: mappedCases.filter((c) => c.status === "in-progress").length,
      completedCases: mappedCases.filter((c) => c.status === "completed").length,
      overdueCases: mappedCases.filter((c) => c.status === "overdue").length,
    };

    return { cases: mappedCases, stats: calculatedStats };
  }, [apiCases, statusFilter, priorityFilter, assigneeFilter, dueDateFilter]);

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
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span className="text-lg">+</span>
            New Case
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            All Cases
          </button>
          <button
            onClick={() => setStatusFilter("in-progress")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === "in-progress"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              statusFilter === "completed"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Stats Grid */}
            <CaseStats
              totalCases={stats.totalCases}
              activeCases={stats.activeCases}
              completedCases={stats.completedCases}
              overdueCases={stats.overdueCases}
            />

            {/* Filters */}
            <CaseFilters
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              assigneeFilter={assigneeFilter}
              dueDateFilter={dueDateFilter}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onAssigneeChange={setAssigneeFilter}
              onDueDateChange={setDueDateFilter}
              onClearFilters={clearFilters}
            />

            {/* Table or Empty State */}
            {cases.length > 0 ? (
              <CaseTable
                cases={cases}
                selectedCases={selectedCases}
                onToggleCaseSelection={toggleCaseSelection}
                onToggleAllCases={toggleAllCases}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-600 mb-6">
                    {statusFilter !== "all" ||
                    priorityFilter !== "all" ||
                    assigneeFilter !== "all" ||
                    dueDateFilter
                      ? "Try adjusting your filters to see more results"
                      : "Get started by creating your first case"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
