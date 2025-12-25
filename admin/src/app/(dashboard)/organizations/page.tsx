import { schema, ilike, or, count } from "@safee/database";
import { Search, Plus } from "lucide-react";
import { OrganizationsTable } from "@/components/organizations/OrganizationsTable";
import Link from "next/link";
import { getDbClient } from "@/lib/db";

async function getOrganizations(searchQuery?: string, page: number = 1, limit: number = 50) {
  const db = getDbClient();
  const offset = (page - 1) * limit;

  try {
    // Get organizations with related Odoo databases using relational query
    const organizations = await db.query.organizations.findMany({
      where: searchQuery
        ? (org, { or, ilike }) => or(ilike(org.name, `%${searchQuery}%`), ilike(org.slug, `%${searchQuery}%`))
        : undefined,
      with: {
        odooDatabase: true,
      },
      orderBy: (org, { desc }) => [desc(org.createdAt)],
      limit,
      offset,
    });

    // Get total count
    const whereClause = searchQuery
      ? or(
          ilike(schema.organizations.name, `%${searchQuery}%`),
          ilike(schema.organizations.slug, `%${searchQuery}%`),
        )
      : undefined;

    const [totalResult] = await db.select({ count: count() }).from(schema.organizations).where(whereClause);

    return {
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        odooDatabase: org.odooDatabase
          ? {
              id: org.odooDatabase.id,
              databaseName: org.odooDatabase.databaseName,
              isActive: org.odooDatabase.isActive,
              createdAt: org.odooDatabase.createdAt,
            }
          : null,
      })),
      total: Number(totalResult?.count ?? 0),
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return {
      organizations: [],
      total: 0,
      page,
      limit,
    };
  }
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.q || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { organizations, total, limit } = await getOrganizations(searchQuery, page);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage organizations and Odoo databases ({total} total)
            </p>
          </div>
          <Link
            href="/organizations/new"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Organization
          </Link>
        </div>
      </div>

      <div className="p-8">
        <div className="rounded-xl bg-white shadow-sm border border-gray-200/60">
          <div className="p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <form action="/organizations" method="get">
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search organizations by name or slug..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </form>
            </div>
          </div>

          <OrganizationsTable organizations={organizations} />

          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/organizations?${new URLSearchParams(
                        searchQuery ? { q: searchQuery, page: String(page - 1) } : { page: String(page - 1) },
                      )}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/organizations?${new URLSearchParams(
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
