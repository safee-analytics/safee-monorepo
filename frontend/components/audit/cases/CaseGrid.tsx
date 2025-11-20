import type { CaseRow } from "./CaseTable";
import { InlineStatus, InlinePriority, InlineAssignee, InlineDueDate } from "./InlineEditFields";
import { useRouter } from "next/navigation";

interface CaseGridProps {
  cases: CaseRow[];
  onCaseClick?: (caseId: string) => void;
  availableUsers?: { id: string; name: string }[];
  onUpdate?: () => void;
}

export function CaseGrid({ cases, onCaseClick, availableUsers = [], onUpdate }: CaseGridProps) {
  const router = useRouter();

  const handleCardClick = (caseId: string) => {
    if (onCaseClick) {
      onCaseClick(caseId);
    } else {
      router.push(`/audit/cases/${caseId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cases.map((caseItem) => (
        <div
          key={caseItem.id}
          onClick={() => handleCardClick(caseItem.id)}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg ${caseItem.iconBg} flex items-center justify-center text-lg`}
              >
                {caseItem.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{caseItem.caseId}</h3>
                <p className="text-xs text-gray-500">{caseItem.auditType}</p>
              </div>
            </div>
          </div>

          {/* Client Name */}
          <p className="text-sm font-medium text-gray-900 mb-3">{caseItem.companyName}</p>

          {/* Status & Priority */}
          <div className="flex items-center gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
            <InlineStatus caseId={caseItem.id} currentStatus={caseItem.status} onUpdate={onUpdate} />
            <InlinePriority caseId={caseItem.id} currentPriority={caseItem.priority} onUpdate={onUpdate} />
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-700">{caseItem.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${caseItem.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between pt-3 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <InlineAssignee
              caseId={caseItem.id}
              currentAssignee={caseItem.assignee}
              availableUsers={availableUsers}
              onUpdate={onUpdate}
            />
            <InlineDueDate caseId={caseItem.id} currentDueDate={caseItem.dueDate} onUpdate={onUpdate} />
          </div>
        </div>
      ))}
    </div>
  );
}
