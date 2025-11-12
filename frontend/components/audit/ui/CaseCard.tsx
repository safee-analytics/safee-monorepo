import { StatusBadge } from "./StatusBadge";
import { CaseStatus } from "@/types/audit";
import { cn } from "@/lib/utils";

interface CaseCardProps {
  companyName: string;
  auditType: string;
  status: CaseStatus;
  dueDate?: string;
  completedDate?: string;
  icon?: string;
  iconBg?: string;
}

export function CaseCard({
  companyName,
  auditType,
  status,
  dueDate,
  completedDate,
  icon = "📄",
  iconBg = "bg-blue-100",
}: CaseCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all mb-3">
      <div
        className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0", iconBg)}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{companyName}</h4>
        <p className="text-xs text-gray-600">{auditType}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={status} />
        {dueDate && <p className="text-xs text-gray-500">Due: {dueDate}</p>}
        {completedDate && <p className="text-xs text-gray-500">Completed: {completedDate}</p>}
      </div>
    </div>
  );
}
