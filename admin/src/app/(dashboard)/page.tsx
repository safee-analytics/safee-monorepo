import {
  Users,
  Building2,
  Database,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { redisConnect, schema, count } from "@safee/database";
import { Queue } from "bullmq";
import { getDbClient } from "@/lib/db";

async function getDashboardStats() {
  const drizzle = getDbClient();

  // Get database counts
  const [usersCount, orgsCount, dbsCount] = await Promise.all([
    drizzle.select({ count: count() }).from(schema.users),
    drizzle.select({ count: count() }).from(schema.organizations),
    drizzle.select({ count: count() }).from(schema.odooDatabases),
  ]);

  // Get active jobs count from all queues - with error handling
  let activeJobsCount = 0;
  try {
    const redis = await redisConnect();

    const queueNames = [
      "analytics",
      "email",
      "odoo-sync",
      "reports",
      "odoo-provisioning",
      "install-modules",
    ];

    for (const queueName of queueNames) {
      try {
        const queue = new Queue(queueName, {
          connection: {
            host: process.env.REDIS_HOST ?? "localhost",
            port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
          },
        });
        const [active, waiting] = await Promise.all([
          queue.getActiveCount(),
          queue.getWaitingCount(),
        ]);
        activeJobsCount += active + waiting;
        await queue.close();
      } catch (queueError) {
        console.error(`Error fetching queue stats for ${queueName}:`, queueError);
      }
    }

    await redis.quit();
  } catch (redisError) {
    console.error("Error connecting to Redis:", redisError);
    // Continue with activeJobsCount = 0
  }

  return {
    users: Number(usersCount[0]?.count ?? 0),
    organizations: Number(orgsCount[0]?.count ?? 0),
    databases: Number(dbsCount[0]?.count ?? 0),
    activeJobs: activeJobsCount,
  };
}

export default async function HomePage() {
  const stats = await getDashboardStats();
  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Users Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg shadow-blue-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-sm font-medium text-blue-100">Total Users</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{stats.users.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Organizations Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 shadow-lg shadow-green-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-sm font-medium text-green-100">Organizations</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{stats.organizations.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Databases Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-lg shadow-purple-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-sm font-medium text-purple-100">Databases</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{stats.databases.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Active Jobs Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 shadow-lg shadow-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-1">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-sm font-medium text-orange-100">Active Jobs</p>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{stats.activeJobs.toLocaleString()}</p>
                {stats.activeJobs > 0 && (
                  <span className="flex items-center text-xs text-orange-100">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200/60 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 mt-2 rounded-full bg-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">
                  New organization created: Acme Corp
                </p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">
                  Database provisioning completed
                </p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 mt-2 rounded-full bg-yellow-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">
                  User john@example.com logged in
                </p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200/60 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">API Server</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Healthy
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: "98%" }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">98% uptime</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Database</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Healthy
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: "95%" }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">95% uptime</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Redis Cache</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Healthy
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: "99%" }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">99% uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
