import { cn } from "@/lib/utils";
import { NotificationType } from "@/types/audit";

interface NotificationCardProps {
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
}

const notificationConfig: Record<NotificationType, { dot: string; bg: string }> = {
  deadline: { dot: "bg-red-500", bg: "bg-red-50" },
  review: { dot: "bg-yellow-500", bg: "bg-yellow-50" },
  completed: { dot: "bg-green-500", bg: "bg-green-50" },
  team: { dot: "bg-blue-500", bg: "bg-blue-50" },
  warning: { dot: "bg-orange-500", bg: "bg-orange-50" },
};

export function NotificationCard({ type, title, description, timestamp }: NotificationCardProps) {
  const config = notificationConfig[type];

  return (
    <div className={cn("p-3 rounded-lg border border-gray-200 mb-3", config.bg)}>
      <div className="flex items-start gap-3">
        <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", config.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-600 mb-1">{description}</p>
          <p className="text-xs text-gray-500">{timestamp}</p>
        </div>
      </div>
    </div>
  );
}
