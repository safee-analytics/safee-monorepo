"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { paths } from "@/lib/api/types";

type ActivityResponse =
  paths["/crm/activities"]["get"]["responses"]["200"]["content"]["application/json"][number];

interface ActivityCalendarProps {
  activities: ActivityResponse[];
}

export function ActivityCalendar({ activities }: ActivityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar days for current month
  const { days, firstDay, daysInMonth } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Add empty days for alignment
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { days, firstDay, daysInMonth };
  }, [currentDate]);

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const grouped: Record<string, ActivityResponse[]> = {};

    activities.forEach((activity) => {
      const date = new Date(activity.dateDeadline);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(activity);
    });

    return grouped;
  }, [activities]);

  const getActivitiesForDay = (day: number) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return activitiesByDate[dateKey] || [];
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getActivityIcon = (activity: ActivityResponse) => {
    const deadline = new Date(activity.dateDeadline);
    const now = new Date();

    if (activity.state === "done") {
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    } else if (activity.state === "overdue" || (activity.state === "today" && deadline < now)) {
      return <XCircle className="h-3 w-3 text-red-600" />;
    } else if (activity.state === "today") {
      return <AlertCircle className="h-3 w-3 text-yellow-600" />;
    } else {
      return <Clock className="h-3 w-3 text-blue-600" />;
    }
  };

  const getActivityColor = (activity: ActivityResponse) => {
    const deadline = new Date(activity.dateDeadline);
    const now = new Date();

    if (activity.state === "done") {
      return "bg-green-100 text-green-700 border-green-200";
    } else if (activity.state === "overdue" || (activity.state === "today" && deadline < now)) {
      return "bg-red-100 text-red-700 border-red-200";
    } else if (activity.state === "today") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayActivities = getActivitiesForDay(day);
          const today = isToday(day);

          return (
            <motion.div
              key={day}
              className={`aspect-square p-2 rounded-lg border transition-all ${
                today
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="h-full flex flex-col">
                <div className={`text-sm font-medium mb-1 ${today ? "text-blue-700" : "text-gray-700"}`}>
                  {day}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {dayActivities.slice(0, 3).map((activity) => (
                    <Link
                      key={activity.id}
                      href={`/crm/leads/${activity.leadId}`}
                      className={`block text-xs px-1.5 py-1 rounded border truncate hover:shadow-sm transition-all ${getActivityColor(
                        activity,
                      )}`}
                      title={activity.activityType?.name || "Activity"}
                    >
                      <div className="flex items-center space-x-1">
                        {getActivityIcon(activity)}
                        <span className="truncate">{activity.activityType?.name || "Activity"}</span>
                      </div>
                    </Link>
                  ))}
                  {dayActivities.length > 3 && (
                    <div className="text-xs text-gray-500 px-1.5">+{dayActivities.length - 3} more</div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
            <span className="text-gray-600">Overdue</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200" />
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
            <span className="text-gray-600">Upcoming</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
            <span className="text-gray-600">Done</span>
          </div>
        </div>
      </div>
    </div>
  );
}
