import { schema, desc, ilike, or, count } from "@safee/database";
import { Search, Plus } from "lucide-react";
import { UsersTable } from "@/components/users/UsersTable";
import Link from "next/link";
import { getDbClient } from "@/lib/db";

async function getUsers(searchQuery?: string, page: number = 1, limit: number = 50) {
  const drizzle = getDbClient();
  const offset = (page - 1) * limit;

  // Build where clause for search
  const whereClause = searchQuery
    ? or(ilike(schema.users.email, `%${searchQuery}%`), ilike(schema.users.name, `%${searchQuery}%`))
    : undefined;

  // Get users with pagination
  const users = await drizzle
    .select()
    .from(schema.users)
    .where(whereClause)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [totalResult] = await drizzle.select({ count: count() }).from(schema.users).where(whereClause);

  return {
    users,
    total: Number(totalResult?.count ?? 0),
    page,
    limit,
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { users, total, limit } = await getUsers(searchQuery, page);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-600">Manage user accounts and permissions ({total} total)</p>
          </div>
          <Link
            href="/users/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-white shadow-sm border border-gray-200/60">
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <form action="/users" method="get">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </form>
            </div>
          </div>

          <UsersTable users={users} />

          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/users?${new URLSearchParams(
                        searchQuery ? { q: searchQuery, page: String(page - 1) } : { page: String(page - 1) },
                      )}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/users?${new URLSearchParams(
                        searchQuery ? { q: searchQuery, page: String(page + 1) } : { page: String(page + 1) },
                      )}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
