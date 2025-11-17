"use client";

import type { CaseRow } from "./CaseTable";
import { InlineStatus, InlinePriority, InlineAssignee, InlineDueDate } from "./InlineEditFields";
import { useRouter } from "next/navigation";

interface CaseKanbanProps {
  cases: CaseRow[];
  onCaseClick?: (caseId: string) => void;
  availableUsers?: { id: string; name: string }[];
  onUpdate?: () => void;
}

type KanbanColumn = "pending" | "in-progress" | "under-review" | "completed";

export function CaseKanban({ cases, onCaseClick, availableUsers = [], onUpdate }: CaseKanbanProps) {
  const router = useRouter();

  const handleCardClick = (caseId: string) => {
    if (onCaseClick) {
      onCaseClick(caseId);
    } else {
      router.push(`/audit/cases/${caseId}`);
    }
  };

  const columns: { id: KanbanColumn; title: string; color: string }[] = [
    { id: "pending", title: "Pending", color: "bg-gray-100 text-gray-700" },
    { id: "in-progress", title: "In Progress", color: "bg-blue-100 text-blue-700" },
    { id: "under-review", title: "Under Review", color: "bg-yellow-100 text-yellow-700" },
    { id: "completed", title: "Completed", color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnCases = cases.filter((c) => c.status === column.id);
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold text-sm px-3 py-1 rounded ${column.color}`}>{column.title}</h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {columnCases.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-3 min-h-[500px]">
              {columnCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  onClick={() => handleCardClick(caseItem.id)}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded ${caseItem.iconBg} flex items-center justify-center text-sm`}
                      >
                        {caseItem.icon}
                      </div>
                      <span className="font-semibold text-sm text-gray-900">{caseItem.caseId}</span>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <InlinePriority
                        caseId={caseItem.id}
                        currentPriority={caseItem.priority}
                        onUpdate={onUpdate}
                      />
                    </div>
                  </div>

                  {/* Client & Audit Type */}
                  <h4 className="font-medium text-sm text-gray-900 mb-1">{caseItem.companyName}</h4>
                  <p className="text-xs text-gray-500 mb-3">{caseItem.auditType}</p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-700">{caseItem.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: `${caseItem.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-2 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <InlineAssignee
                      caseId={caseItem.id}
                      currentAssignee={caseItem.assignee}
                      availableUsers={availableUsers}
                      onUpdate={onUpdate}
                    />
                    <InlineDueDate
                      caseId={caseItem.id}
                      currentDueDate={caseItem.dueDate}
                      onUpdate={onUpdate}
                    />
                  </div>
                </div>
              ))}

              {columnCases.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No cases</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
