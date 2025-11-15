import { List, LayoutGrid, Download } from "lucide-react";
import { StatusBadge } from "@/components/audit/ui/StatusBadge";
import { PriorityBadge } from "@/components/audit/ui/PriorityBadge";
import { CaseStatus, CasePriority } from "@/types/audit";

export interface CaseRow {
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

interface CaseTableProps {
  cases: CaseRow[];
  selectedCases: string[];
  onToggleCaseSelection: (caseId: string) => void;
  onToggleAllCases: () => void;
}

export function CaseTable({ cases, selectedCases, onToggleCaseSelection, onToggleAllCases }: CaseTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Cases</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <List className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <LayoutGrid className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
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
              <tr key={caseRow.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedCases.includes(caseRow.id)}
                    onChange={() => onToggleCaseSelection(caseRow.id)}
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
  );
}
