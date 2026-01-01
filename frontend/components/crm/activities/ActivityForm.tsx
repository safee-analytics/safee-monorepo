"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useLeads, useCrmTeams } from "@/lib/api/hooks";
import { activityFormSchema, type ActivityFormData } from "@/lib/api/schemas";
import { AnimatedButton } from "@safee/ui";
import type { paths } from "@/lib/api/types";
import { type ActivityType, leadSchema } from "@/lib/validation";

type ActivityResponse =
  paths["/crm/activities/{activityId}"]["get"]["responses"]["200"]["content"]["application/json"];

interface ActivityFormProps {
  activity?: ActivityResponse;
  onSubmit: (data: ActivityFormData) => Promise<void>;
  isSubmitting: boolean;
  defaultLeadId?: number;
}

// TODO: [Backend] - Fetch ACTIVITY_TYPES from API
//   Details: The `ACTIVITY_TYPES` are currently hardcoded. They should be fetched from a backend API to allow for dynamic and configurable activity types.
//   Priority: High
const ACTIVITY_TYPES: ActivityType[] = [
  { id: 1, name: "Call" },
  { id: 2, name: "Meeting" },
  { id: 3, name: "Email" },
  { id: 4, name: "Demo" },
  { id: 5, name: "Proposal" },
  { id: 6, name: "Quote" },
  { id: 7, name: "Follow-up" },
  { id: 8, name: "Presentation" },
];

export function ActivityForm({ activity, onSubmit, isSubmitting, defaultLeadId }: ActivityFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: activity
      ? {
          leadId: activity.leadId,
          activityTypeId: activity.activityType?.id,
          summary: activity.summary || "",
          note: activity.note || "",
          dateDeadline: activity.dateDeadline
            ? new Date(activity.dateDeadline).toISOString().slice(0, 16)
            : "",
          userId: activity.user?.id,
        }
      : defaultLeadId
        ? { leadId: defaultLeadId }
        : undefined,
  });

  const { data: leads } = useLeads({ active: true });
  const { data: teams } = useCrmTeams({ active: true });

  const selectedLeadId = useWatch({ control, name: "leadId" });
  const selectedActivityTypeId = useWatch({ control, name: "activityTypeId" });
  const currentSummary = useWatch({ control, name: "summary" });
  const currentDeadline = useWatch({ control, name: "dateDeadline" });
  // Get all users from teams
  const users = useMemo(() => {
    if (!teams) return [];
    const allUsers: { id: number; name: string }[] = [];
    for (const team of teams) {
      if (team.memberIds) {
        for (const memberId of team.memberIds) {
          if (!allUsers.find((u) => u.id === memberId)) {
            // TODO: [Backend/Frontend] - Fetch user details from memberId
//   Details: Currently, user names are mocked as `User ${memberId}`. Implement an API endpoint to fetch full user details based on `memberId` and update this logic to display actual user names.
//   Priority: Medium
            allUsers.push({ id: memberId, name: `User ${memberId}` });
          }
        }
      }
    }
    return allUsers;
  }, [teams]);

  // Auto-fill from selected lead
  useEffect(() => {
    if (selectedLeadId && leads && !activity) {
      const selectedLead = leads.find((l) => l.id === selectedLeadId);
      if (selectedLead) {
        // Auto-fill summary with lead name
        if (!currentSummary) {
          setValue("summary", `Follow up: ${selectedLead.name}`);
        }

        // Auto-assign to lead's current user if available
        if (selectedLead.user?.id) {
          setValue("userId", selectedLead.user.id);
        }
      }
    }
  }, [selectedLeadId, leads, setValue, activity, currentSummary]);

  // Auto-fill due date based on activity type
  useEffect(() => {
    if (selectedActivityTypeId && !activity) {
      const selectedType = ACTIVITY_TYPES.find((t) => t.id === selectedActivityTypeId);
      if (selectedType) {
        if (!currentDeadline) {
          // Default suggestions based on activity type name
          const now = new Date();
          let daysToAdd = 1; // Default: tomorrow

          const typeName = selectedType.name.toLowerCase();
          if (typeName.includes("call") || typeName.includes("email")) {
            daysToAdd = 1; // Same or next day
          } else if (typeName.includes("meeting") || typeName.includes("demo")) {
            daysToAdd = 3; // 3 days out
          } else if (typeName.includes("proposal") || typeName.includes("quote")) {
            daysToAdd = 7; // 1 week
          }

          now.setDate(now.getDate() + daysToAdd);
          now.setHours(9, 0, 0, 0); // 9 AM default time
          setValue("dateDeadline", now.toISOString().slice(0, 16));
        }
      }
    }
  }, [selectedActivityTypeId, setValue, activity, currentDeadline]);

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit((data) => {
          void onSubmit(data);
        })(event);
      }}
      className="space-y-6"
    >
      {/* Lead Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lead / Opportunity <span className="text-red-500">*</span>
            </label>
            <select
              {...register("leadId", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!!defaultLeadId}
            >
              <option value="">Select a lead...</option>
              {leads?.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} - {lead.stage?.name || "No stage"}
                </option>
              ))}
            </select>
            {errors.leadId && <p className="mt-1 text-sm text-red-600">{errors.leadId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("activityTypeId", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select activity type...</option>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors.activityTypeId && (
              <p className="mt-1 text-sm text-red-600">{errors.activityTypeId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              {...register("dateDeadline")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.dateDeadline && (
              <p className="mt-1 text-sm text-red-600">{errors.dateDeadline.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
            <select
              {...register("userId", { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Assign to user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary & Notes */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary & Notes</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Summary</label>
            <input
              type="text"
              {...register("summary")}
              placeholder="Brief description of the activity"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.summary && <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              {...register("note")}
              rows={5}
              placeholder="Detailed notes about the activity..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            {errors.note && <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4">
        <AnimatedButton type="button" variant="outline" disabled={isSubmitting}>
          Cancel
        </AnimatedButton>
        <AnimatedButton type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {activity ? "Updating..." : "Creating..."}
            </>
          ) : activity ? (
            "Update Activity"
          ) : (
            "Create Activity"
          )}
        </AnimatedButton>
      </div>
    </form>
  );
}
