"use client";

import { useEffect, useRef } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  UserPlus,
  UserMinus,
  Clock,
  Archive,
  FileSpreadsheet,
} from "lucide-react";
import {
  useCaseActivities,
  useMarkActivitiesAsRead,
  type CaseActivityResponse,
} from "@/lib/api/hooks/collaboration";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  caseId: string;
  limit?: number;
  enableRealtime?: boolean; // Enable polling for real-time updates
  showMarkAsRead?: boolean;
  className?: string;
}

const activityIcons: Record<string, React.ElementType> = {
  case_created: FileText,
  status_changed: AlertCircle,
  priority_updated: AlertCircle,
  document_uploaded: Upload,
  document_approved: CheckCircle,
  document_rejected: XCircle,
  comment_added: FileText,
  team_member_assigned: UserPlus,
  team_member_removed: UserMinus,
  case_completed: CheckCircle,
  case_archived: Archive,
  scope_created: FileSpreadsheet,
  procedure_completed: CheckCircle,
  plan_created: FileSpreadsheet,
  report_generated: FileText,
};

const activityColors: Record<string, string> = {
  case_created: "bg-blue-100 text-blue-600",
  status_changed: "bg-purple-100 text-purple-600",
  priority_updated: "bg-orange-100 text-orange-600",
  document_uploaded: "bg-blue-100 text-blue-600",
  document_approved: "bg-green-100 text-green-600",
  document_rejected: "bg-red-100 text-red-600",
  comment_added: "bg-gray-100 text-gray-600",
  team_member_assigned: "bg-green-100 text-green-600",
  team_member_removed: "bg-red-100 text-red-600",
  case_completed: "bg-green-100 text-green-600",
  case_archived: "bg-gray-100 text-gray-600",
  scope_created: "bg-blue-100 text-blue-600",
  procedure_completed: "bg-green-100 text-green-600",
  plan_created: "bg-purple-100 text-purple-600",
  report_generated: "bg-blue-100 text-blue-600",
};

function getActivityMessage(activity: CaseActivityResponse): string {
  const userName = activity.user?.name || "Someone";
  const metadata = activity.metadata || {};

  switch (activity.activityType) {
    case "case_created":
      return `${userName} created the case ${metadata.caseName || ""}`;
    case "status_changed":
      return `${userName} changed status from ${metadata.oldValue} to ${metadata.newValue}`;
    case "priority_updated":
      return `${userName} updated priority from ${metadata.oldValue} to ${metadata.newValue}`;
    case "document_uploaded":
      return `${userName} uploaded ${metadata.documentName || "a document"}`;
    case "document_approved":
      return `${userName} approved ${metadata.documentName || "a document"}`;
    case "document_rejected":
      return `${userName} rejected ${metadata.documentName || "a document"}`;
    case "comment_added":
      return `${userName} added a comment`;
    case "team_member_assigned":
      return `${userName} assigned ${metadata.assignedUserName || "a team member"}`;
    case "team_member_removed":
      return `${userName} removed ${metadata.assignedUserName || "a team member"}`;
    case "case_completed":
      return `${userName} completed the case`;
    case "case_archived":
      return `${userName} archived the case`;
    case "scope_created":
      return `${userName} created a new scope`;
    case "procedure_completed":
      return `${userName} completed a procedure`;
    case "plan_created":
      return `${userName} created an audit plan`;
    case "report_generated":
      return `${userName} generated a report`;
    default:
      return `${userName} performed an action`;
  }
}

export function ActivityFeed({
  caseId,
  limit = 20,
  enableRealtime = false,
  showMarkAsRead = false,
  className = "",
}: ActivityFeedProps) {
  const { data: activities = [], isLoading } = useCaseActivities(caseId, {
    limit,
    refetchInterval: enableRealtime ? 5000 : undefined, // Poll every 5 seconds if realtime enabled
  });

  const markAsRead = useMarkActivitiesAsRead();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (containerRef.current && activities.length > 0) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [activities.length]);

  const handleMarkAllAsRead = () => {
    const activityIds = activities.map((a) => a.id);
    if (activityIds.length > 0) {
      markAsRead.mutate(activityIds);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading activity...</span>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm text-gray-600 mb-1">No activity yet</p>
        <p className="text-xs text-gray-500">Activity will appear here as actions are taken</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showMarkAsRead && activities.length > 0 && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700">
            {activities.length} {activities.length === 1 ? "Activity" : "Activities"}
          </p>
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAsRead.isPending}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>
      )}

      <div ref={containerRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.activityType] || FileText;
          const colorClass = activityColors[activity.activityType] || "bg-gray-100 text-gray-600";

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-relaxed">{getActivityMessage(activity)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                  {enableRealtime && (
                    <span
                      className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"
                      title="Real-time updates enabled"
                    />
                  )}
                </div>
              </div>

              {activity.user && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-blue-600">
                    {activity.user.name?.substring(0, 2).toUpperCase() || "??"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {enableRealtime && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Real-time updates active</span>
          </div>
        </div>
      )}
    </div>
  );
}
