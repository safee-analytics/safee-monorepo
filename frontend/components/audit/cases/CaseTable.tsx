import { CaseStatus, CasePriority } from "@/types/audit";
import { InlineStatus, InlinePriority, InlineAssignee, InlineDueDate } from "./InlineEditFields";
import { useRouter } from "next/navigation";
import { InlineCreateRow } from "@safee/ui";

export interface CaseRow {
  id: string;
  caseId: string;
  auditType: string;
  companyName: string;
  industry: string;
  assignee: {
    name: string;
    avatar: string;
    id?: string;
  };
  status: CaseStatus;
  priority: CasePriority;
  dueDate: string;
  progress: number;
  icon: string;
  iconBg: string;
}

interface CaseTableProps {
  cases: CaseRow[];
  selectedCases: string[];
  onToggleCaseSelection: (caseId: string) => void;
  onToggleAllCases: () => void;
  availableUsers?: { id: string; name: string }[];
  onUpdate?: () => void;
  onCaseClick?: (caseId: string) => void;
  onCreateCase?: (title: string) => void | Promise<void>;
}

export function CaseTable({
  cases,
  selectedCases,
  onToggleCaseSelection,
  onToggleAllCases,
  availableUsers = [],
  onUpdate,
  onCaseClick,
  onCreateCase,
}: CaseTableProps) {
  const router = useRouter();

  const handleRowClick = (caseId: string) => {
    if (onCaseClick) {
      onCaseClick(caseId);
    } else {
      router.push(`/audit/cases/${caseId}`);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCases.length === cases.length}
                  onChange={onToggleAllCases}
                  className="rounded border-gray-300 cursor-pointer"
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
              <tr
                key={caseRow.id}
                onClick={() => {
                  handleRowClick(caseRow.id);
                }}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td
                  className="px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(caseRow.id)}
                    onChange={() => {
                      onToggleCaseSelection(caseRow.id);
                    }}
                    className="rounded border-gray-300 cursor-pointer"
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
                <td
                  className="px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <InlineAssignee
                    caseId={caseRow.id}
                    currentAssignee={caseRow.assignee}
                    availableUsers={availableUsers}
                    onUpdate={onUpdate}
                  />
                </td>
                <td
                  className="px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <InlineStatus caseId={caseRow.id} currentStatus={caseRow.status} onUpdate={onUpdate} />
                </td>
                <td
                  className="px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <InlinePriority
                    caseId={caseRow.id}
                    currentPriority={caseRow.priority}
                    onUpdate={onUpdate}
                  />
                </td>
                <td
                  className="px-6 py-4"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <InlineDueDate caseId={caseRow.id} currentDueDate={caseRow.dueDate} onUpdate={onUpdate} />
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

            {/* Inline Create Row - Jira style quick add */}
            {onCreateCase && (
              <InlineCreateRow
                onSubmit={onCreateCase}
                placeholder="Type case title and press Enter..."
                buttonText="Add new case"
                columns={8}
              />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
