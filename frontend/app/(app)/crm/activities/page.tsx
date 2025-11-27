"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  List,
} from "lucide-react";
import { ActivityTimeline } from "@/components/crm/activities/ActivityTimeline";
import { ActivityCalendar } from "@/components/crm/activities/ActivityCalendar";
import { useCrmActivities, useSyncCRM } from "@/lib/api/hooks";
import { useCrmStore } from "@/stores/useCrmStore";
import { AnimatedButton } from "@safee/ui";

export default function ActivitiesPage() {
  const { activityFilters, setActivityFilters } = useCrmStore();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("calendar");

  const { data: activities, isLoading } = useCrmActivities(activityFilters);
  const syncMutation = useSyncCRM();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("activities");
    } catch (error) {
      console.error("Failed to sync activities:", error);
    }
  };

  const handleStateFilter = (state?: "overdue" | "today" | "planned" | "done") => {
    if (state) {
      setActivityFilters({ state });
    } else {
      setActivityFilters({});
    }
  };

  // Count activities by state
  const activityCounts = activities?.reduce(
    (acc, activity) => {
      const state = activity.state;
      const deadline = new Date(activity.dateDeadline);
      const now = new Date();

      if (state === "done") {
        acc.done++;
      } else if (state === "overdue" || (state === "today" && deadline < now)) {
        acc.overdue++;
      } else if (state === "today") {
        acc.today++;
      } else {
        acc.upcoming++;
      }
      return acc;
    },
    { overdue: 0, today: 0, upcoming: 0, done: 0 },
  ) || { overdue: 0, today: 0, upcoming: 0, done: 0 };

  const activeFilter = activityFilters.state;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
              <p className="text-sm text-gray-600 mt-1">Track and manage all your sales activities</p>
            </div>
            <div className="flex items-center space-x-3">
              <AnimatedButton
                onClick={handleSync}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </AnimatedButton>
              <Link href="/crm/activities/new">
                <AnimatedButton
                  variant="primary"
                  size="md"
                  className="flex items-center space-x-2 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Activity</span>
                </AnimatedButton>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <button
              onClick={() => handleStateFilter()}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                !activeFilter
                  ? "bg-gray-50 border-gray-300"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">All Activities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activityCounts.overdue +
                      activityCounts.today +
                      activityCounts.upcoming +
                      activityCounts.done}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </button>

            <button
              onClick={() => handleStateFilter("overdue")}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                activeFilter === "overdue"
                  ? "bg-red-50 border-red-300"
                  : "bg-white border-gray-200 hover:border-red-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{activityCounts.overdue}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </button>

            <button
              onClick={() => handleStateFilter("today")}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                activeFilter === "today"
                  ? "bg-yellow-50 border-yellow-300"
                  : "bg-white border-gray-200 hover:border-yellow-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Due Today</p>
                  <p className="text-2xl font-bold text-yellow-600">{activityCounts.today}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-400" />
              </div>
            </button>

            <button
              onClick={() => handleStateFilter("done")}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                activeFilter === "done"
                  ? "bg-green-50 border-green-300"
                  : "bg-white border-gray-200 hover:border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{activityCounts.done}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStateFilter()}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !activeFilter ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStateFilter("overdue")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === "overdue" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Overdue
              </button>
              <button
                onClick={() => handleStateFilter("today")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === "today" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => handleStateFilter("planned")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === "planned" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => handleStateFilter("done")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === "done" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Completed
              </button>
            </div>

            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "calendar"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Calendar view"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "timeline"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Timeline view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Advanced filters coming soon...</p>
                <button
                  onClick={() => {
                    setActivityFilters({});
                    setShowFilters(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : activities ? (
          viewMode === "calendar" ? (
            <ActivityCalendar activities={activities} />
          ) : (
            <ActivityTimeline activities={activities} />
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
