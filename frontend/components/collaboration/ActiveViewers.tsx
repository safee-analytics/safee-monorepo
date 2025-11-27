"use client";

import { Eye, Users } from "lucide-react";
import { useActiveViewers, usePresenceTracking } from "@/lib/api/hooks/collaboration";
import { formatDistanceToNow } from "date-fns";

interface ActiveViewersProps {
  caseId: string;
  enableRealtime?: boolean; // Enable polling for real-time updates
  showSelf?: boolean; // Show current user in the list
  variant?: "compact" | "full";
  className?: string;
}

export function ActiveViewers({
  caseId,
  enableRealtime = true,
  showSelf = false,
  variant = "compact",
  className = "",
}: ActiveViewersProps) {
  // Track current user's presence
  usePresenceTracking(caseId, true);

  // Get active viewers with optional polling
  const { data: viewers = [], isLoading } = useActiveViewers(caseId, {
    refetchInterval: enableRealtime ? 3000 : undefined, // Poll every 3 seconds if realtime enabled
  });

  if (isLoading) {
    return null;
  }

  if (viewers.length === 0) {
    return null;
  }

  const displayViewers = showSelf ? viewers : viewers.slice(0, 5);
  const overflowCount = viewers.length - displayViewers.length;

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center -space-x-2">
          {displayViewers.map((viewer) => (
            <div
              key={viewer.id}
              className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white flex items-center justify-center group"
              title={`${viewer.user?.name || "Unknown"} - ${formatDistanceToNow(new Date(viewer.lastSeenAt), { addSuffix: true })}`}
            >
              <span className="text-xs font-semibold text-white">
                {viewer.user?.name?.substring(0, 2).toUpperCase() || "??"}
              </span>
              {enableRealtime && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="font-medium">{viewer.user?.name || "Unknown"}</div>
                <div className="text-gray-300 text-xs">
                  Active {formatDistanceToNow(new Date(viewer.lastSeenAt), { addSuffix: true })}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          ))}
          {overflowCount > 0 && (
            <div
              className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center"
              title={`${overflowCount} more ${overflowCount === 1 ? "viewer" : "viewers"}`}
            >
              <span className="text-xs font-semibold text-gray-600">+{overflowCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Eye className="w-4 h-4" />
          <span className="font-medium">{viewers.length}</span>
          {enableRealtime && (
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1" title="Real-time updates active" />
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Active Viewers</h3>
          <p className="text-xs text-gray-500">
            {viewers.length} {viewers.length === 1 ? "person" : "people"} viewing this case
          </p>
        </div>
        {enableRealtime && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">Live</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {viewers.map((viewer) => (
          <div
            key={viewer.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-white">
                {viewer.user?.name?.substring(0, 2).toUpperCase() || "??"}
              </span>
              {enableRealtime && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {viewer.user?.name || "Unknown User"}
              </p>
              <p className="text-xs text-gray-500 truncate">{viewer.user?.email || ""}</p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(viewer.lastSeenAt), { addSuffix: true })}
              </p>
              <p className="text-xs text-green-600 font-medium">Active</p>
            </div>
          </div>
        ))}
      </div>

      {viewers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No one is currently viewing this case</p>
        </div>
      )}
    </div>
  );
}
