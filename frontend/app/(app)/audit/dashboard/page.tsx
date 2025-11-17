"use client";

import { motion } from "framer-motion";
import { FileText, AlertCircle, CheckCircle, Users } from "lucide-react";
import { StatCard } from "@/components/audit/ui/StatCard";
import { NotificationCard } from "@/components/audit/ui/NotificationCard";
import { CaseCard } from "@/components/audit/ui/CaseCard";
import { ActivityItem } from "@/components/audit/ui/ActivityItem";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useCases, useNotifications, useActivity } from "@/lib/api/hooks";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuditDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: apiCases, isLoading: casesLoading } = useCases();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  const { data: activity, isLoading: activityLoading } = useActivity();

  const isLoading = casesLoading || notificationsLoading || activityLoading;

  const trackNavigation = (eventName: string, metadata?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Navigation Event:", { eventName, metadata, timestamp: new Date().toISOString() });
    }
  };

  const handleConditionalNavigation = (e: React.MouseEvent, path: string, requiresPermission?: string) => {
    e.preventDefault();

    const hasPermission = true;

    if (requiresPermission && !hasPermission) {
      console.warn("Navigation blocked: Insufficient permissions", { path, requiresPermission });
      return;
    }

    trackNavigation("navigation_allowed", { path, requiresPermission });
    router.push(path);
  };

  const stats = useMemo(() => {
    if (!apiCases) {
      return {
        activeCases: 0,
        activeCasesChange: "from last month",
        pendingReviews: 0,
        completedAudits: 0,
        completionRate: "0% completion rate",
        teamMembers: 0,
        activeToday: "0 active today",
      };
    }

    const activeCases = apiCases.filter((c) => c.status === "in-progress").length;
    const completedAudits = apiCases.filter((c) => c.status === "completed").length;
    const pendingReviews = apiCases.filter((c) => c.status === "under-review").length;
    const totalCases = apiCases.length;
    const completionRate = totalCases > 0 ? Math.round((completedAudits / totalCases) * 100) : 0;

    // Get unique team members from assignments
    const uniqueMembers = new Set<string>();
    apiCases.forEach((c) => {
      c.assignments?.forEach((a) => {
        if (a.userId) uniqueMembers.add(a.userId);
      });
    });

    return {
      activeCases,
      activeCasesChange: "from last month",
      pendingReviews,
      completedAudits,
      completionRate: `${completionRate}% completion rate`,
      teamMembers: uniqueMembers.size,
      activeToday: `${uniqueMembers.size} active today`,
    };
  }, [apiCases]);

  // Map real notifications to dashboard format
  const recentNotifications = useMemo(() => {
    if (!notifications) return [];

    return notifications.slice(0, 4).map((notification) => ({
      id: notification.id,
      type: notification.type as "deadline" | "review" | "completed" | "team",
      title: notification.title,
      description: notification.message,
      timestamp: new Date(notification.createdAt).toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
    }));
  }, [notifications]);

  const recentCases = useMemo(() => {
    if (!apiCases) return [];

    return apiCases.slice(0, 3).map((caseData) => ({
      id: caseData.id,
      companyName: caseData.clientName,
      auditType: caseData.auditType,
      status: caseData.status as "in-progress" | "completed" | "overdue",
      dueDate: caseData.dueDate
        ? new Date(caseData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "No date",
      completedDate:
        caseData.status === "completed"
          ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : undefined,
      icon: "📋",
      iconBg:
        caseData.status === "completed"
          ? "bg-green-100"
          : caseData.status === "overdue"
            ? "bg-red-100"
            : "bg-blue-100",
    }));
  }, [apiCases]);

  const teamActivity = useMemo(() => {
    if (!activity) return [];

    return activity.slice(0, 4).map((item) => ({
      id: item.id,
      userId: item.userId,
      userName: item.userName,
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userName}`,
      action: item.action,
      description: item.description,
      timestamp: new Date(item.createdAt).toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }),
      icon: (item.actionType || "check") as "check" | "play" | "edit" | "upload",
    }));
  }, [activity]);

  const chartData = useMemo(() => {
    if (!apiCases) return [];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const casesInMonth = apiCases.filter((c) => {
        if (!c.createdAt) return false;
        const caseDate = new Date(c.createdAt);
        return caseDate.getMonth() === index && caseDate.getFullYear() === currentYear;
      });

      return {
        month,
        completed: casesInMonth.filter((c) => c.status === "completed").length,
        inProgress: casesInMonth.filter((c) => c.status === "in-progress").length,
        pending: casesInMonth.filter((c) => c.status === "pending" || c.status === "under-review").length,
      };
    });
  }, [apiCases]);

  const maxValue = Math.max(...chartData.map((d) => d.completed + d.inProgress + d.pending), 1);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.audit.casesOverviewTitle}</h1>
          <p className="text-gray-600">{t.audit.casesOverviewSubtitle}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link
              href="/audit/cases?status=in-progress"
              onClick={() =>
                trackNavigation("stat_card_clicked", { cardName: "Active Cases", status: "in-progress" })
              }
              className="block cursor-pointer transition-transform hover:scale-105"
            >
              <StatCard
                title={t.audit.activeCases}
                value={stats.activeCases}
                subtitle={t.audit.fromLastMonth}
                icon={FileText}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
                trend={{ value: "+12%", positive: true }}
              />
            </Link>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link
              href="/audit/cases?status=under-review"
              onClick={() =>
                trackNavigation("stat_card_clicked", { cardName: "Pending Reviews", status: "under-review" })
              }
              className="block cursor-pointer transition-transform hover:scale-105"
            >
              <StatCard
                title={t.audit.pendingReviews}
                value={stats.pendingReviews}
                subtitle={t.audit.overdue}
                icon={AlertCircle}
                iconBgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
            </Link>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link
              href="/audit/cases?status=completed"
              onClick={() =>
                trackNavigation("stat_card_clicked", { cardName: "Completed Audits", status: "completed" })
              }
              className="block cursor-pointer transition-transform hover:scale-105"
            >
              <StatCard
                title={t.audit.completedAudits}
                value={stats.completedAudits}
                subtitle={t.audit.completionRate}
                icon={CheckCircle}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
            </Link>
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <Link
              href="/audit/team"
              onClick={(e) => handleConditionalNavigation(e, "/audit/team", "view_team")}
              className="block cursor-pointer transition-transform hover:scale-105"
            >
              <StatCard
                title={t.audit.teamMembers}
                value={stats.teamMembers}
                subtitle={t.audit.activeToday}
                icon={Users}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Cases Progress Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Cases Progress</h2>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
                <option>Last year</option>
              </select>
            </div>

            {/* Simple Bar Chart */}
            <div className="h-80">
              <div className="h-full flex items-end justify-between gap-2">
                {chartData.map((data, idx) => {
                  const _total = data.completed + data.inProgress + data.pending;
                  const completedHeight = (data.completed / maxValue) * 100;
                  const inProgressHeight = (data.inProgress / maxValue) * 100;
                  const pendingHeight = (data.pending / maxValue) * 100;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center gap-0.5 mb-2">
                        <div
                          className="w-full bg-green-500 rounded-t"
                          style={{ height: `${completedHeight * 2.5}px` }}
                        />
                        <div
                          className="w-full bg-yellow-500"
                          style={{ height: `${inProgressHeight * 2.5}px` }}
                        />
                        <div
                          className="w-full bg-red-500 rounded-b"
                          style={{ height: `${pendingHeight * 2.5}px` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            </div>
            <div className="space-y-3">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <NotificationCard {...notification} />
                </div>
              ))}
            </div>
            <Link
              href="/notifications"
              className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              View all notifications
            </Link>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
              <Link href="/audit/cases" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div>
              {recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  href={`/audit/cases/${caseItem.id}`}
                  className="block cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <CaseCard {...caseItem} />
                </Link>
              ))}
            </div>
          </div>

          {/* Team Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Team Activity</h2>
              <Link href="/audit/team" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View team
              </Link>
            </div>
            <div>
              {teamActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ActivityItem {...activity} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
