import { cn } from "@/lib/utils";

type StatusType = "completed" | "in-progress" | "pending" | "overdue" | "under-review" | "archived" | "active" | "away";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig = {
  completed: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
    label: "Completed",
  },
  "in-progress": {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-600",
    label: "In Progress",
  },
  pending: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-600",
    label: "Pending",
  },
  overdue: {
    bg: "bg-red-100",
    text: "text-red-700",
    dot: "bg-red-600",
    label: "Overdue",
  },
  "under-review": {
    bg: "bg-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-600",
    label: "Under Review",
  },
  archived: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
    label: "Archived",
  },
  active: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-600",
    label: "Active",
  },
  away: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-600",
    label: "Away",
  },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium",
        config.bg,
        config.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {label || config.label}
    </span>
  );
}
