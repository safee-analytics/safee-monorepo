import { Check, Play, Edit, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  userName: string;
  userAvatar: string;
  action: string;
  description: string;
  timestamp: string;
  icon: "check" | "play" | "edit" | "upload";
}

const iconConfig = {
  check: { Icon: Check, bg: "bg-green-100", color: "text-green-600" },
  play: { Icon: Play, bg: "bg-blue-100", color: "text-blue-600" },
  edit: { Icon: Edit, bg: "bg-yellow-100", color: "text-yellow-600" },
  upload: { Icon: Upload, bg: "bg-gray-100", color: "text-gray-600" },
};

export function ActivityItem({
  userName,
  userAvatar,
  action,
  description,
  timestamp,
  icon,
}: ActivityItemProps) {
  const config = iconConfig[icon];
  const IconComponent = config.Icon;

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors mb-2">
      <div className="relative">
        <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm">
              <span className="font-medium text-gray-900">{userName}</span>
              <span className="text-gray-600"> {action}</span>
            </p>
            <p className="text-xs text-gray-600">{description}</p>
            <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
          </div>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", config.bg)}>
            <IconComponent className={cn("w-4 h-4", config.color)} />
          </div>
        </div>
      </div>
    </div>
  );
}
