"use client";

import { useState } from "react";
import {
  useResourceAssignments,
  useAssignResource,
  useUnassignResource,
  type ResourceType,
} from "@/lib/api/hooks";
import { useOrganizationMembers } from "@/lib/api/hooks/organization";
import { UserPlus, X, Loader2 } from "lucide-react";

interface AssignmentManagerProps {
  resourceType: ResourceType;
  resourceId: string;
}

export function AssignmentManager({ resourceType, resourceId }: AssignmentManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const { data: members } = useOrganizationMembers("");
  const { data: assignments, isLoading: assignmentsLoading } = useResourceAssignments(resourceType, resourceId);
  const assignMutation = useAssignResource();
  const unassignMutation = useUnassignResource();

  const assignedUserIds = assignments?.map((a) => a.userId) || [];
  const availableMembers = members?.filter((m) => !assignedUserIds.includes(m.userId)) || [];

  async function handleAssign() {
    if (!selectedUserId) return;

    try {
      await assignMutation.mutateAsync({
        userId: selectedUserId,
        resourceType,
        resourceId,
        role: selectedRole || undefined,
      });
      setSelectedUserId("");
      setSelectedRole("");
    } catch (error) {
      console.error("Failed to assign user:", error);
    }
  }

  async function handleUnassign(userId: string) {
    try {
      await unassignMutation.mutateAsync({
        userId,
        resourceType,
        resourceId,
      });
    } catch (error) {
      console.error("Failed to unassign user:", error);
    }
  }

  if (assignmentsLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Assignments</h3>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {assignments?.length || 0} {assignments?.length === 1 ? "person" : "people"} assigned
        </div>
      </div>

      {/* Current assignments */}
      <div className="space-y-2">
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment) => {
            const member = members?.find((m) => m.userId === assignment.userId);
            return (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-safee-100 dark:bg-safee-900/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-safee-700 dark:text-safee-300">
                      {member?.user?.name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member?.user?.name || "Unknown User"}
                    </p>
                    {assignment.role && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">{assignment.role}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { void handleUnassign(assignment.userId); }}
                  disabled={unassignMutation.isPending}
                  className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove assignment"
                >
                  {unassignMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            No assignments yet. Add people to give them access to this resource.
          </p>
        )}
      </div>

      {/* Add assignment form */}
      {availableMembers.length > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500 dark:focus:ring-safee-400 focus:border-transparent"
            >
              <option value="">Select a user...</option>
              {availableMembers.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.user?.name || member.user?.email || "Unknown User"}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              placeholder="Role (optional)"
              className="w-36 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-safee-500 dark:focus:ring-safee-400 focus:border-transparent"
            />

            <button
              onClick={() => { void handleAssign(); }}
              disabled={!selectedUserId || assignMutation.isPending}
              className="px-4 py-2 bg-safee-600 dark:bg-safee-500 text-white rounded-lg hover:bg-safee-700 dark:hover:bg-safee-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {availableMembers.length === 0 && assignments && assignments.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
          All organization members have been assigned.
        </p>
      )}
    </div>
  );
}
