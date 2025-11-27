"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Clock, AlertCircle, Calendar, User } from "lucide-react";
import { useMarkCrmActivityDone } from "@/lib/api/hooks";
import { AnimatedButton } from "@safee/ui";
import { toast } from "react-hot-toast";
import type { paths } from "@/lib/api/types";

type ActivityResponse =
  paths["/crm/activities"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface ActivityTimelineProps {
  activities: ActivityResponse[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const markDoneMutation = useMarkCrmActivityDone();

  const handleMarkDone = async (activityId: number) => {
    try {
      await markDoneMutation.mutateAsync(activityId);
      toast.success("Activity marked as done!");
    } catch (error) {
      toast.error("Failed to mark activity as done");
    }
  };

  // Group activities by state
  const groupedActivities = activities.reduce(
    (acc, activity) => {
      const state = activity.state;
      if (state === "overdue") {
        acc.overdue.push(activity);
      } else if (state === "today") {
        const deadline = new Date(activity.dateDeadline);
        const now = new Date();
        if (deadline < now) {
          acc.overdue.push(activity);
        } else {
          acc.today.push(activity);
        }
      } else if (state === "done") {
        acc.done.push(activity);
      } else {
        acc.upcoming.push(activity);
      }
      return acc;
    },
    {
      overdue: [] as ActivityResponse[],
      today: [] as ActivityResponse[],
      upcoming: [] as ActivityResponse[],
      done: [] as ActivityResponse[],
    },
  );

  const getStateIcon = (state: string, dateDeadline: string) => {
    const deadline = new Date(dateDeadline);
    const now = new Date();

    if (state === "done") {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    } else if (state === "overdue" || (state === "today" && deadline < now)) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else if (state === "today") {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStateColor = (state: string, dateDeadline: string) => {
    const deadline = new Date(dateDeadline);
    const now = new Date();

    if (state === "done") {
      return "bg-green-50 border-green-200";
    } else if (state === "overdue" || (state === "today" && deadline < now)) {
      return "bg-red-50 border-red-200";
    } else if (state === "today") {
      return "bg-yellow-50 border-yellow-200";
    } else {
      return "bg-blue-50 border-blue-200";
    }
  };

  const ActivityCard = ({ activity }: { activity: ActivityResponse }) => (
    <div
      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${getStateColor(
        activity.state,
        activity.dateDeadline,
      )}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="mt-1">{getStateIcon(activity.state, activity.dateDeadline)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">{activity.activityType?.name || "Activity"}</h3>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  activity.state === "done"
                    ? "bg-green-100 text-green-700"
                    : activity.state === "overdue"
                      ? "bg-red-100 text-red-700"
                      : activity.state === "today"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                }`}
              >
                {activity.state}
              </span>
            </div>

            {activity.summary && <p className="text-sm text-gray-700 mb-2">{activity.summary}</p>}

            {activity.note && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.note}</p>}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <Link href={`/crm/leads/${activity.leadId}`} className="flex items-center hover:text-blue-600">
                <Calendar className="h-3 w-3 mr-1" />
                View Lead
              </Link>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Due: {new Date(activity.dateDeadline).toLocaleDateString()}
              </span>
              {activity.user && (
                <span className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {activity.user.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {activity.state !== "done" && (
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => handleMarkDone(activity.id)}
            disabled={markDoneMutation.isPending}
            className="ml-4"
          >
            Mark Done
          </AnimatedButton>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Overdue */}
      {groupedActivities.overdue.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <XCircle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Overdue ({groupedActivities.overdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {groupedActivities.overdue.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Today */}
      {groupedActivities.today.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">Today ({groupedActivities.today.length})</h2>
          </div>
          <div className="space-y-3">
            {groupedActivities.today.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {groupedActivities.upcoming.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Upcoming ({groupedActivities.upcoming.length})
            </h2>
          </div>
          <div className="space-y-3">
            {groupedActivities.upcoming.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {groupedActivities.done.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Completed ({groupedActivities.done.length})
            </h2>
          </div>
          <div className="space-y-3">
            {groupedActivities.done.slice(0, 5).map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
          {groupedActivities.done.length > 5 && (
            <p className="text-sm text-gray-500 text-center mt-3">
              Showing 5 of {groupedActivities.done.length} completed activities
            </p>
          )}
        </div>
      )}

      {activities.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-2">No activities yet</p>
          <p className="text-sm text-gray-400">Create your first activity to get started</p>
        </div>
      )}
    </div>
  );
}
