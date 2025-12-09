import { getCurrentUser, isSuperAdmin } from "@/lib/auth/permissions";

export default async function DashboardOverviewPage() {
  const user = await getCurrentUser();
  const isSuper = await isSuperAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to the Safee Admin Dashboard, {user.name}
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Access Level
        </h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Role
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {isSuper ? "Super Admin (Platform-wide)" : "Organization Admin"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {user.email}
            </dd>
          </div>
          {!isSuper && user.organizationId && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Organization ID
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                {user.organizationId}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Users", value: "—", description: "Coming soon" },
          { title: "Active Jobs", value: "—", description: "Coming soon" },
          { title: "Redis Status", value: "—", description: "Coming soon" },
          { title: "DB Connections", value: "—", description: "Coming soon" },
        ].map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 shadow rounded-lg p-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {stat.title}
            </h3>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Phase 1: Foundation Complete ✓
        </h2>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          The admin dashboard foundation is set up. Next phases will add:
        </p>
        <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
          <li>System Monitoring (Redis, Database, Storage)</li>
          <li>User & Organization Management</li>
          <li>Odoo Integration Management</li>
          <li>Job Scheduler Dashboard</li>
        </ul>
      </div>
    </div>
  );
}
