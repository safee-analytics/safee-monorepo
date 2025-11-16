import { CaseStatus, CasePriority } from "@/types/audit";

interface CaseFiltersProps {
  statusFilter: CaseStatus | "all";
  priorityFilter: CasePriority | "all";
  assigneeFilter: string;
  dueDateFilter: string;
  onStatusChange: (value: CaseStatus | "all") => void;
  onPriorityChange: (value: CasePriority | "all") => void;
  onAssigneeChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onClearFilters: () => void;
}

export function CaseFilters({
  statusFilter,
  priorityFilter,
  assigneeFilter,
  dueDateFilter,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
  onClearFilters,
}: CaseFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as CaseStatus | "all")}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="under-review">Under Review</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Priority:</label>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as CasePriority | "all")}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Assignee:</label>
          <select
            value={assigneeFilter}
            onChange={(e) => onAssigneeChange(e.target.value)}
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
            onChange={(e) => onDueDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            placeholder="mm/dd/yyyy"
          />
        </div>

        <button
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-auto"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
