import { schema, desc, ilike, or, count, eq } from "@safee/database";
import { Search, Plus } from "lucide-react";
import { OrganizationsTable } from "@/components/organizations/OrganizationsTable";
import Link from "next/link";
import { getDbClient } from "@/lib/db";

async function getOrganizations(searchQuery?: string, page: number = 1, limit: number = 50) {
  const drizzle = getDbClient();
  const offset = (page - 1) * limit;

  try {
    // Build where clause for search
    const whereClause = searchQuery
      ? or(
          ilike(schema.organizations.name, `%${searchQuery}%`),
          ilike(schema.organizations.slug, `%${searchQuery}%`),
        )
      : undefined;

    // Get organizations
    const orgsResult = await drizzle
      .select({
        id: schema.organizations.id,
        name: schema.organizations.name,
        slug: schema.organizations.slug,
        createdAt: schema.organizations.createdAt,
        updatedAt: schema.organizations.updatedAt,
      })
      .from(schema.organizations)
      .where(whereClause)
      .orderBy(desc(schema.organizations.createdAt))
      .limit(limit)
      .offset(offset);

    // Get Odoo databases separately to avoid join issues
    const organizations = await Promise.all(
      (orgsResult || []).map(async (org) => {
        try {
          const [odooDb] = await drizzle
            .select({
              id: schema.odooDatabases.id,
              dbName: schema.odooDatabases.dbName,
              status: schema.odooDatabases.status,
              createdAt: schema.odooDatabases.createdAt,
            })
            .from(schema.odooDatabases)
            .where(eq(schema.odooDatabases.organizationId, org.id))
            .limit(1);

          return {
            id: org.id || "",
            name: org.name || "",
            slug: org.slug || "",
            createdAt: org.createdAt || new Date(),
            updatedAt: org.updatedAt || new Date(),
            odooDatabase: odooDb
              ? {
                  id: odooDb.id || "",
                  dbName: odooDb.dbName || "",
                  status: odooDb.status || "",
                  createdAt: odooDb.createdAt || new Date(),
                }
              : null,
          };
        } catch (error) {
          console.error("Error fetching Odoo database for org:", org.id, error);
          return {
            id: org.id || "",
            name: org.name || "",
            slug: org.slug || "",
            createdAt: org.createdAt || new Date(),
            updatedAt: org.updatedAt || new Date(),
            odooDatabase: null,
          };
        }
      }),
    );

    // Get total count
    const [totalResult] = await drizzle
      .select({ count: count() })
      .from(schema.organizations)
      .where(whereClause);

    return {
      organizations: organizations || [],
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
