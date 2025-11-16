import { cn } from "@/lib/utils";
import { CasePriority } from "@/types/audit";

interface PriorityBadgeProps {
  priority: CasePriority;
}

const priorityConfig: Record<CasePriority, { bg: string; text: string; label: string }> = {
  critical: {
    bg: "bg-red-200",
    text: "text-red-900",
    label: "Critical",
  },
  high: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "High",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    label: "Medium",
  },
  low: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "Low",
  },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium",
        config.bg,
        config.text,
      )}
    >
      {config.label}
    </span>
  );
}
