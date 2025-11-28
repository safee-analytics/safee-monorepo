"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  ListTodo,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useLeads, useContacts, useCrmActivities, useStages } from "@/lib/api/hooks";
import { StatsCardSkeleton } from "@/components/crm/shared/LoadingSkeleton";

export default function CRMDashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads({ active: true });
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: activities, isLoading: activitiesLoading } = useCrmActivities();
  const { data: stages } = useStages();

  const isLoading = leadsLoading || contactsLoading || activitiesLoading;

  const opportunities = leads?.filter((l) => l.type === "opportunity") || [];
  const _activeLeads = leads?.filter((l) => l.type === "lead") || [];

  const wonStage = stages?.find((s) => s.isWon);
  const wonOpportunities = wonStage ? leads?.filter((l) => l.stage?.id === wonStage.id) || [] : [];

  const totalExpectedRevenue = opportunities.reduce((sum, opp) => sum + (opp.expectedRevenue || 0), 0);

  const totalLeads = leads?.length || 0;
  const totalContacts = contacts?.length || 0;
  const _totalActivities = activities?.length || 0;
  const wonCount = wonOpportunities.length;

  const conversionRate =
    opportunities.length > 0 ? ((wonCount / opportunities.length) * 100).toFixed(1) : "0";

  const overdueActivities =
    activities?.filter(
      (a) => a.state === "overdue" || (a.state === "today" && new Date(a.dateDeadline) < new Date()),
    ) || [];

  const stats = [
    {
      title: "Total Leads",
      value: totalLeads.toString(),
      change: "+8.3%",
      trend: "up",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/crm/leads",
    },
    {
      title: "Won Opportunities",
      value: wonCount.toString(),
      change: `${conversionRate}% conv`,
      trend: "up",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/crm/leads?type=opportunity",
    },
    {
      title: "Expected Revenue",
      value: `$${(totalExpectedRevenue / 1000).toFixed(1)}K`,
      change: "+15.2%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/crm/leads?type=opportunity",
    },
    {
      title: "Contacts",
      value: totalContacts.toString(),
      change: "+5",
      trend: "up",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/crm/contacts",
    },
  ];

  const quickActions = [
    {
      label: "Add Lead",
      href: "/crm/leads/new",
      icon: Target,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: "Add Contact",
      href: "/crm/contacts/new",
      icon: UserPlus,
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: "View All Leads",
      href: "/crm/leads",
      icon: ListTodo,
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: "View Activities",
      href: "/crm/activities",
      icon: Clock,
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const topOpportunities =
    opportunities.sort((a, b) => (b.expectedRevenue || 0) - (a.expectedRevenue || 0)).slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage leads, opportunities, and customer relationships</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={stat.href}
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <TrendIcon
                          className={`h-4 w-4 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}
                        />
                        <span
                          className={`text-sm ml-1 font-medium ${
                            stat.trend === "up" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`${stat.bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.4 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={action.href}
                className={`${action.color} text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-lg`}
              >
                <Icon className="h-4 w-4" />
                <span>{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Opportunities</h2>
            <Link href="/crm/leads?type=opportunity" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {topOpportunities.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No opportunities yet</p>
              <Link href="/crm/leads/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Create your first lead
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topOpportunities.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/crm/leads/${opp.id}`}
                  className="block p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{opp.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{opp.partnerName || opp.contactName}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className="text-xs text-gray-500">Stage: {opp.stage?.name || "N/A"}</span>
                        {opp.probability !== undefined && (
                          <span className="text-xs text-gray-500">{opp.probability}% probability</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${(opp.expectedRevenue || 0).toLocaleString()}
                      </p>
                      {opp.dateDeadline && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {new Date(opp.dateDeadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <Link href="/crm/activities" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        activity.state === "overdue"
                          ? "bg-red-50"
                          : activity.state === "today"
                            ? "bg-yellow-50"
                            : activity.state === "done"
                              ? "bg-green-50"
                              : "bg-blue-50"
                      }`}
                    >
                      {activity.state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : activity.state === "overdue" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {activity.activityType?.name || "Activity"}
                      </h3>
                      {activity.summary && <p className="text-sm text-gray-600 mt-1">{activity.summary}</p>}
                      <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
                        <span>Due: {new Date(activity.dateDeadline).toLocaleDateString()}</span>
                        <span>{activity.user?.name || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No activities yet</p>
              <Link
                href="/crm/activities/new"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                Create your first activity
              </Link>
            </div>
          )}
        </div>
      </div>

      {overdueActivities.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <XCircle className="h-4 w-4 text-red-600" />
            <h3 className="font-semibold text-red-900">
              {overdueActivities.length} Overdue {overdueActivities.length === 1 ? "Activity" : "Activities"}
            </h3>
          </div>
          <p className="text-sm text-red-700 mt-1">
            You have overdue activities that need attention.{" "}
            <Link href="/crm/activities" className="underline">
              View all activities
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
