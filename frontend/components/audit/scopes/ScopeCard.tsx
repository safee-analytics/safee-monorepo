"use client";

import { useState, useEffect } from "react";
import { Button } from "@safee/ui";
import { ChevronRight, MoreVertical, Calendar, CheckCircle2, Clock } from "lucide-react";
import type { components } from "@/lib/api/types/audit";
import { useUpdateScopeStatus, useCaseSections, useCaseProcedures } from "@/lib/api/hooks";
import { useToast } from "@safee/ui";
import { logError } from "@/lib/utils/logger";

type ScopeResponse = components["schemas"]["ScopeResponse"];
type AuditStatus = components["schemas"]["AuditStatus"];

interface ScopeCardProps {
  scope: ScopeResponse;
  onClick: () => void;
}

// Helper component to fetch procedure counts for a single section
function SectionProcedureCounts({
  caseId,
  scopeId,
  sectionId,
  onCountsReady,
}: {
  caseId: string;
  scopeId: string;
  sectionId: string;
  onCountsReady: (total: number, completed: number) => void;
}) {
  const { data: procedures } = useCaseProcedures(caseId, scopeId, sectionId);

  useEffect(() => {
    if (procedures) {
      const total = procedures.length;
      const completed = procedures.filter((p) => p.isCompleted).length;
      onCountsReady(total, completed);
    }
  }, [procedures, onCountsReady]);

  return null; // This component doesn't render anything
}

export function ScopeCard({ scope, onClick }: ScopeCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [procedureCounts, setProcedureCounts] = useState<Map<string, { total: number; completed: number }>>(
    new Map(),
  );

  const toast = useToast();
  const updateStatus = useUpdateScopeStatus();

  // Fetch sections to calculate progress
  const { data: sections } = useCaseSections(scope.caseId, scope.id);

  const handleSectionCountsReady = (sectionId: string, total: number, completed: number) => {
    setProcedureCounts((prev) => {
      const newMap = new Map(prev);
      newMap.set(sectionId, { total, completed });
      return newMap;
    });
  };

  // Calculate totals from aggregated procedure counts
  const totalProcedures = Array.from(procedureCounts.values()).reduce((sum, counts) => sum + counts.total, 0);
  const completedProcedures = Array.from(procedureCounts.values()).reduce(
    (sum, counts) => sum + counts.completed,
    0,
  );

  // Calculate progress based on procedures
  const progress = totalProcedures > 0 ? Math.round((completedProcedures / totalProcedures) * 100) : 0;

  const totalSections = sections?.length || 0;
  const completedSections = sections?.filter((s) => s.isCompleted).length || 0;

  const getStatusColor = (status: AuditStatus) => {
    switch (status) {
      case "draft":
        return { bg: "bg-gray-100", text: "text-gray-700", icon: Clock };
      case "in_progress":
        return { bg: "bg-blue-100", text: "text-blue-700", icon: Clock };
      case "under_review":
        return { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock };
      case "completed":
        return { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 };
      case "archived":
        return { bg: "bg-gray-100", text: "text-gray-500", icon: CheckCircle2 };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", icon: Clock };
    }
  };

  const statusStyle = getStatusColor(scope.status);
  const StatusIcon = statusStyle.icon;

  const handleChangeStatus = async (newStatus: AuditStatus) => {
    try {
      await updateStatus.mutateAsync({
        caseId: scope.caseId,
        scopeId: scope.id,
        status: { status: newStatus },
      });
      toast.success(`Scope status updated to ${newStatus}`);
      setShowActions(false);
    } catch (error) {
      logError("Failed to update scope status", error, {
        caseId: scope.caseId,
        scopeId: scope.id,
        currentStatus: scope.status,
        newStatus,
      });
      toast.error("Failed to update scope status");
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all overflow-hidden group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{scope.name}</h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1`}
              >
                <StatusIcon className="h-3 w-3" />
                {scope.status.replace(/_/g, " ")}
              </span>
            </div>
            {scope.description && <p className="text-sm text-gray-600 line-clamp-2">{scope.description}</p>}
          </div>

          <div className="relative ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>

            {showActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => void handleChangeStatus("in_progress")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => void handleChangeStatus("under_review")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => void handleChangeStatus("completed")}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mark Completed
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={() => void handleChangeStatus("archived")}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Archive Scope
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                progress === 100 ? "bg-green-600" : progress > 50 ? "bg-blue-600" : "bg-blue-400"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Sections</div>
            <div className="text-lg font-semibold text-gray-900">
              {completedSections}/{totalSections}
            </div>
            <div className="text-xs text-gray-600">completed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Procedures</div>
            <div className="text-lg font-semibold text-gray-900">
              {completedProcedures}/{totalProcedures || "—"}
            </div>
            <div className="text-xs text-gray-600">completed</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {scope.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatDate(scope.createdAt)}</span>
            </div>
          )}
          {scope.completedAt && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Completed {formatDate(scope.completedAt)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button onClick={onClick} className="w-full" variant="outline">
          <span>Open Scope</span>
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Hidden components to fetch procedure counts for each section */}
      {sections?.map((section) => (
        <SectionProcedureCounts
          key={section.id}
          caseId={scope.caseId}
          scopeId={scope.id}
          sectionId={section.id}
          onCountsReady={(total, completed) => handleSectionCountsReady(section.id, total, completed)}
        />
      ))}
    </div>
  );
}
