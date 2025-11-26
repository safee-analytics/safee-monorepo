"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCases, useCreateCase, type CaseData, type CaseAssignment } from "@/lib/api/hooks";
import { CaseStats } from "@/components/audit/cases/CaseStats";
import { CaseFilters, type FilterToken } from "@/components/audit/cases/CaseFilters";
import { CaseTable, type CaseRow } from "@/components/audit/cases/CaseTable";
import { CaseGrid } from "@/components/audit/cases/CaseGrid";
import { CaseKanban } from "@/components/audit/cases/CaseKanban";
import { CreateCaseWizard } from "@/components/audit/cases/CreateCaseWizard";
import { CasePreviewDrawer } from "@/components/audit/cases/CasePreviewDrawer";
import { CaseCommands, useCaseCommands } from "@/components/audit/cases/CaseCommands";
import { KeyboardShortcutsOverlay } from "@/components/audit/cases/KeyboardShortcutsOverlay";
import { BatchOperationsBar } from "@/components/audit/cases/BatchOperationsBar";
import { SavedViewsManager } from "@/components/audit/cases/SavedViewsManager";
import { useAuditStore } from "@/stores/useAuditStore";
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "@/lib/hooks/useKeyboardShortcuts";
import { isValidCaseStatus, isValidCasePriority } from "@/lib/api/schemas";
import { useToast } from "@safee/ui";
import type { CaseStatus, CasePriority } from "@/types/audit";

export default function CaseManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  // Local state
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOverlayOpen, setShortcutsOverlayOpen] = useState(false);
  const [filters, setFilters] = useState<FilterToken[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState<"all" | "active" | "completed">("all");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "kanban">("list");
  const [previewCase, setPreviewCase] = useState<CaseRow | null>(null);

  // Global store
  const {
    savedViews,
    activeView,
    saveView,
    deleteView,
    applyView,
    toggleViewFavorite,
    updateView,
  } = useAuditStore();

  // Enable Cmd+K for command palette
  useCaseCommands(() => setCommandPaletteOpen(true));

  // Keyboard shortcuts
  useKeyboardShortcuts({
    enabled: !commandPaletteOpen && !isCreateModalOpen && !shortcutsOverlayOpen,
    shortcuts: [
      {
        key: COMMON_SHORTCUTS.NEW.key,
        action: () => setIsCreateModalOpen(true),
        description: COMMON_SHORTCUTS.NEW.description,
        category: COMMON_SHORTCUTS.NEW.category,
      },
      {
        key: COMMON_SHORTCUTS.SEARCH.key,
        action: () => {
          const searchInput = document.querySelector<HTMLInputElement>('input[type="text"]');
          searchInput?.focus();
        },
        description: COMMON_SHORTCUTS.SEARCH.description,
        category: COMMON_SHORTCUTS.SEARCH.category,
      },
      {
        key: COMMON_SHORTCUTS.HELP.key,
        action: () => setShortcutsOverlayOpen(true),
        description: COMMON_SHORTCUTS.HELP.description,
        category: COMMON_SHORTCUTS.HELP.category,
      },
    ],
    sequences: [
      {
        sequence: COMMON_SHORTCUTS.GO_DASHBOARD.sequence,
        action: () => router.push("/audit/dashboard"),
        description: COMMON_SHORTCUTS.GO_DASHBOARD.description,
        category: COMMON_SHORTCUTS.GO_DASHBOARD.category,
      },
      {
        sequence: COMMON_SHORTCUTS.GO_CASES.sequence,
        action: () => router.push("/audit/cases"),
        description: COMMON_SHORTCUTS.GO_CASES.description,
        category: COMMON_SHORTCUTS.GO_CASES.category,
      },
      {
        sequence: COMMON_SHORTCUTS.GO_DOCUMENTS.sequence,
        action: () => router.push("/audit/documents"),
        description: COMMON_SHORTCUTS.GO_DOCUMENTS.description,
        category: COMMON_SHORTCUTS.GO_DOCUMENTS.category,
      },
      {
        sequence: COMMON_SHORTCUTS.VIEW_TABLE.sequence,
        action: () => setViewMode("list"),
        description: COMMON_SHORTCUTS.VIEW_TABLE.description,
        category: COMMON_SHORTCUTS.VIEW_TABLE.category,
      },
      {
        sequence: COMMON_SHORTCUTS.VIEW_GRID.sequence,
        action: () => setViewMode("grid"),
        description: COMMON_SHORTCUTS.VIEW_GRID.description,
        category: COMMON_SHORTCUTS.VIEW_GRID.category,
      },
      {
        sequence: COMMON_SHORTCUTS.VIEW_KANBAN.sequence,
        action: () => setViewMode("kanban"),
        description: COMMON_SHORTCUTS.VIEW_KANBAN.description,
        category: COMMON_SHORTCUTS.VIEW_KANBAN.category,
      },
    ],
  });

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "in-progress") {
      setActiveStatusTab("active");
    } else if (statusParam === "completed") {
      setActiveStatusTab("completed");
    } else if (statusParam === "under-review") {
      // Add filter token for under-review since it's not a tab
      setFilters([{ type: "status", value: "under-review", display: "Under Review" }]);
    } else {
      setActiveStatusTab("all");
    }
  }, [searchParams]);

  // Build API filters from URL and filter tokens
  const apiFilters = useMemo(() => {
    const result: { status?: string; priority?: string; assignedTo?: string } = {};

    // Get status from URL with validation
    const statusParam = searchParams.get("status");
    if (statusParam && isValidCaseStatus(statusParam)) {
      result.status = statusParam;
    }

    // Add filters from filter tokens (can override URL params)
    filters.forEach((filter) => {
      if (filter.type === "status" && isValidCaseStatus(filter.value)) {
        result.status = filter.value;
      } else if (filter.type === "priority" && isValidCasePriority(filter.value)) {
        result.priority = filter.value;
      } else if (filter.type === "assignee") {
        result.assignedTo = filter.value;
      }
    });

    return Object.keys(result).length > 0 ? result : undefined;
  }, [searchParams, filters]);

  const { data: apiCases, isLoading, refetch } = useCases(apiFilters);
  const createCaseMutation = useCreateCase();

  const handleQuickCreate = async (title: string) => {
    try {
      await createCaseMutation.mutateAsync({
        clientName: title,
        auditType: "financial_audit",
        status: "pending",
        priority: "medium",
        dueDate: undefined,
      });
      toast.success("Case created successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to create case");
      console.error("Failed to create case:", error);
    }
  };

  const { cases, stats, availableAssignees } = useMemo(() => {
    // Map API cases to table rows
    let mappedCases: CaseRow[] = (apiCases ?? []).map((caseData: CaseData) => {
      // Get the lead assignee from assignments (prefer lead role, fallback to any assignee)
      const leadAssignment = caseData.assignments?.find((a: CaseAssignment) => a.role === "lead");
      const anyAssignment = caseData.assignments?.[0];
      const assignment = leadAssignment || anyAssignment;

      const assigneeName = assignment?.user?.name || assignment?.user?.email || "Unassigned";
      const assigneeId = assignment?.userId || caseData.createdBy;

      return {
        id: caseData.id,
        caseId: caseData.caseNumber,
        auditType: caseData.auditType,
        companyName: caseData.clientName,
        industry: "General",
        assignee: {
          name: assigneeName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${assigneeId}`,
          id: assigneeId,
        },
        status: caseData.status as CaseStatus,
        priority: caseData.priority as CasePriority,
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
      };
    });

    // Extract unique assignees for filter dropdown
    const assigneeMap = new Map<string, string>();
    apiCases?.forEach((caseData: CaseData) => {
      caseData.assignments?.forEach((assignment: CaseAssignment) => {
        if (assignment.user && assignment.userId) {
          assigneeMap.set(assignment.userId, assignment.user.name || assignment.user.email);
        }
      });
    });
    const uniqueAssignees = Array.from(assigneeMap.entries()).map(([id, name]) => ({ id, name }));

    // Apply client-side filters only for non-API filters (like text search)
    filters.forEach((filter) => {
      if (filter.type === "text") {
        const searchText = filter.value.toLowerCase();
        mappedCases = mappedCases.filter(
          (c) =>
            c.caseId.toLowerCase().includes(searchText) ||
            c.companyName.toLowerCase().includes(searchText) ||
            c.auditType.toLowerCase().includes(searchText) ||
            c.assignee.name.toLowerCase().includes(searchText),
        );
      }
    });

    // Calculate stats from all cases (not filtered)
    const calculatedStats = {
      totalCases: (apiCases ?? []).length,
      activeCases: (apiCases ?? []).filter((c: CaseData) => c.status === "in-progress").length,
      completedCases: (apiCases ?? []).filter((c: CaseData) => c.status === "completed").length,
      overdueCases: (apiCases ?? []).filter((c: CaseData) => c.status === "overdue").length,
    };

    return { cases: mappedCases, stats: calculatedStats, availableAssignees: uniqueAssignees };
  }, [apiCases, filters]);

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

  const handleCaseClick = (caseId: string) => {
    const caseData = cases.find((c) => c.id === caseId);
    if (caseData) {
      setPreviewCase(caseData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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

        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => {
              setActiveStatusTab("all");
              router.push("/audit/cases");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeStatusTab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-gray-700 hover:bg-white"
            }`}
          >
            All Cases
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("active");
              router.push("/audit/cases?status=in-progress");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeStatusTab === "active"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => {
              setActiveStatusTab("completed");
              router.push("/audit/cases?status=completed");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
              activeStatusTab === "completed"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-700 hover:bg-white"
            }`}
          >
            Completed
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!isLoading && (
          <>
            <CaseStats
              totalCases={stats.totalCases}
              activeCases={stats.activeCases}
              completedCases={stats.completedCases}
              overdueCases={stats.overdueCases}
            />

            <CaseFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableAssignees={availableAssignees}
            />

            <SavedViewsManager
              savedViews={savedViews}
              activeViewId={activeView || undefined}
              currentFilters={filters}
              currentViewMode={viewMode}
              onSaveView={saveView}
              onLoadView={(view) => {
                setFilters(view.filters);
                setViewMode(view.viewMode);
                applyView(view.id);
              }}
              onDeleteView={deleteView}
              onToggleFavorite={toggleViewFavorite}
              onUpdateView={updateView}
            />

            <div className="mb-4 flex items-center justify-end">
              <div className="flex items-center bg-white rounded-lg border border-gray-300 p-1 gap-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  title="List view"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Grid view"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "kanban"
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  title="Kanban view"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </button>
              </div>
            </div>

            {cases.length > 0 ? (
              <>
                {viewMode === "list" && (
                  <CaseTable
                    cases={cases}
                    selectedCases={selectedCases}
                    onToggleCaseSelection={toggleCaseSelection}
                    onToggleAllCases={toggleAllCases}
                    availableUsers={availableAssignees}
                    onUpdate={refetch}
                    onCaseClick={handleCaseClick}
                    onCreateCase={handleQuickCreate}
                  />
                )}
                {viewMode === "grid" && (
                  <CaseGrid
                    cases={cases}
                    availableUsers={availableAssignees}
                    onUpdate={refetch}
                    onCaseClick={handleCaseClick}
                  />
                )}
                {viewMode === "kanban" && (
                  <CaseKanban
                    cases={cases}
                    availableUsers={availableAssignees}
                    onUpdate={refetch}
                    onCaseClick={handleCaseClick}
                  />
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No cases found</h3>
                  <p className="text-gray-600 mb-6">
                    {filters.length > 0
                      ? "Try adjusting your filters to see more results"
                      : "Get started by creating your first case"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateCaseWizard
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <CasePreviewDrawer
        isOpen={!!previewCase}
        onClose={() => setPreviewCase(null)}
        caseData={
          previewCase
            ? {
                id: previewCase.id,
                caseNumber: previewCase.caseId,
                clientName: previewCase.companyName,
                auditType: previewCase.auditType,
                status: previewCase.status,
                priority: previewCase.priority,
                dueDate: previewCase.dueDate,
                assignee: previewCase.assignee,
                progress: previewCase.progress,
              }
            : null
        }
      />

      <CaseCommands
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewCase={() => {
          setCommandPaletteOpen(false);
          setIsCreateModalOpen(true);
        }}
        onDuplicateCase={() => {
          setCommandPaletteOpen(false);
          if (selectedCases.length === 1) {
            const selectedCase = cases.find((c) => c.id === selectedCases[0]);
            if (selectedCase) {
              toast.info("Duplicate case feature coming soon");
            }
          } else {
            toast.warning("Please select exactly one case to duplicate");
          }
        }}
        onSaveTemplate={() => {
          setCommandPaletteOpen(false);
          toast.info("Save as template feature coming soon");
        }}
        onArchiveSelected={() => {
          setCommandPaletteOpen(false);
          toast.info(`Archive ${selectedCases.length} case(s) - Coming soon`);
        }}
        onExport={() => {
          setCommandPaletteOpen(false);
          toast.info("Export feature coming soon");
        }}
        onBulkStatusChange={() => {
          setCommandPaletteOpen(false);
          toast.info("Bulk status change feature coming soon");
        }}
        onViewChange={(view) => {
          setCommandPaletteOpen(false);
          setViewMode(view);
          toast.success(`Switched to ${view} view`);
        }}
        onShowShortcuts={() => {
          setCommandPaletteOpen(false);
          setShortcutsOverlayOpen(true);
        }}
        selectedCasesCount={selectedCases.length}
      />

      <BatchOperationsBar
        selectedCount={selectedCases.length}
        onClearSelection={() => setSelectedCases([])}
        onArchive={() => toast.info(`Archive ${selectedCases.length} case(s) - Coming soon`)}
        onDelete={() => toast.info(`Delete ${selectedCases.length} case(s) - Coming soon`)}
        onStatusChange={() => toast.info("Bulk status change feature coming soon")}
        onAssignTeam={() => toast.info("Assign team feature coming soon")}
        onExport={() => toast.info("Export feature coming soon")}
      />

      <KeyboardShortcutsOverlay
        isOpen={shortcutsOverlayOpen}
        onClose={() => setShortcutsOverlayOpen(false)}
      />
    </div>
  );
}
