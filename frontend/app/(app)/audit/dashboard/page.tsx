"use client";

import { motion } from "framer-motion";
import { FileText, AlertCircle, CheckCircle, Users } from "lucide-react";
import { StatCard } from "@/components/audit/ui/StatCard";
import { NotificationCard } from "@/components/audit/ui/NotificationCard";
import { CaseCard } from "@/components/audit/ui/CaseCard";
import { ActivityItem } from "@/components/audit/ui/ActivityItem";
import { useTranslation } from "@/lib/providers/TranslationProvider";

export default function AuditDashboard() {
  const { t } = useTranslation();
  // Mock data - will be replaced with API calls
  const stats = {
    activeCases: 24,
    activeCasesChange: "+12% from last month",
    pendingReviews: 8,
    completedAudits: 156,
    completionRate: "96% completion rate",
    teamMembers: 12,
    activeToday: "8 active today",
  };

  const recentNotifications = [
    {
      id: "1",
      type: "deadline" as const,
      title: "Audit deadline approaching",
      description: "ABC Corp audit due in 2 days",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "review" as const,
      title: "Review required",
      description: "Financial statements need approval",
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "completed" as const,
      title: "Audit completed",
      description: "XYZ Ltd audit successfully finished",
      timestamp: "6 hours ago",
    },
    {
      id: "4",
      type: "team" as const,
      title: "New team member",
      description: "John Smith joined the audit team",
      timestamp: "1 day ago",
    },
  ];

  const recentCases = [
    {
      id: "1",
      companyName: "ABC Corporation",
      auditType: "Annual Financial Audit",
      status: "in-progress" as const,
      dueDate: "Dec 15",
      icon: "📊",
      iconBg: "bg-blue-100",
    },
    {
      id: "2",
      companyName: "XYZ Retail Ltd",
      auditType: "Inventory Audit",
      status: "completed" as const,
      completedDate: "Dec 10",
      icon: "🏪",
      iconBg: "bg-green-100",
    },
    {
      id: "3",
      companyName: "Manufacturing Co",
      auditType: "Compliance Audit",
      status: "overdue" as const,
      dueDate: "Dec 8",
      icon: "🏭",
      iconBg: "bg-red-100",
    },
  ];

  const teamActivity = [
    {
      id: "1",
      userId: "1",
      userName: "Michael Chen",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      action: "Completed review",
      description: "Completed ABC Corp review",
      timestamp: "2 hours ago",
      icon: "check" as const,
    },
    {
      id: "2",
      userId: "2",
      userName: "Emma Rodriguez",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      action: "Started audit",
      description: "Started inventory audit",
      timestamp: "4 hours ago",
      icon: "play" as const,
    },
    {
      id: "3",
      userId: "3",
      userName: "David Kim",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
      action: "Updated assessment",
      description: "Updated risk assessment",
      timestamp: "6 hours ago",
      icon: "edit" as const,
    },
    {
      id: "4",
      userId: "4",
      userName: "Lisa Thompson",
      userAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
      action: "Uploaded documents",
      description: "Uploaded financial documents",
      timestamp: "1 day ago",
      icon: "upload" as const,
    },
  ];

  const chartData = [
    { month: "Jan", completed: 12, inProgress: 8, pending: 3 },
    { month: "Feb", completed: 15, inProgress: 6, pending: 4 },
    { month: "Mar", completed: 18, inProgress: 9, pending: 2 },
    { month: "Apr", completed: 22, inProgress: 7, pending: 5 },
    { month: "May", completed: 19, inProgress: 10, pending: 3 },
    { month: "Jun", completed: 28, inProgress: 8, pending: 6 },
    { month: "Jul", completed: 25, inProgress: 9, pending: 4 },
    { month: "Aug", completed: 23, inProgress: 11, pending: 2 },
    { month: "Sep", completed: 20, inProgress: 9, pending: 5 },
    { month: "Oct", completed: 18, inProgress: 12, pending: 3 },
    { month: "Nov", completed: 22, inProgress: 7, pending: 6 },
    { month: "Dec", completed: 27, inProgress: 8, pending: 4 },
  ];

  const maxValue = Math.max(...chartData.map((d) => d.completed + d.inProgress + d.pending));

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.audit.dashboardTitle}</h1>
          <p className="text-gray-600">{t.audit.dashboardSubtitle}</p>
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
            <StatCard
              title={t.audit.activeCases}
              value={stats.activeCases}
              subtitle={t.audit.fromLastMonth}
              icon={FileText}
              iconBgColor="bg-blue-100"
              iconColor="text-blue-600"
              trend={{ value: "+12%", positive: true }}
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard
              title={t.audit.pendingReviews}
              value={stats.pendingReviews}
              subtitle={t.audit.overdue}
              icon={AlertCircle}
              iconBgColor="bg-yellow-100"
              iconColor="text-yellow-600"
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard
              title={t.audit.completedAudits}
              value={stats.completedAudits}
              subtitle={t.audit.completionRate}
              icon={CheckCircle}
              iconBgColor="bg-green-100"
              iconColor="text-green-600"
            />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <StatCard
              title={t.audit.teamMembers}
              value={stats.teamMembers}
              subtitle={t.audit.activeToday}
              icon={Users}
              iconBgColor="bg-purple-100"
              iconColor="text-purple-600"
            />
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Audit Progress Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Audit Progress Overview</h2>
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
                <NotificationCard key={notification.id} {...notification} />
              ))}
            </div>
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-4">
              View all notifications
            </button>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Cases */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Cases</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</button>
            </div>
            <div>
              {recentCases.map((caseItem) => (
                <CaseCard key={caseItem.id} {...caseItem} />
              ))}
            </div>
          </div>

          {/* Team Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Team Activity</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View team</button>
            </div>
            <div>
              {teamActivity.map((activity) => (
                <ActivityItem key={activity.id} {...activity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
