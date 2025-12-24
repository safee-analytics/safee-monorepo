import { schema, eq } from "@safee/database";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getDbClient } from "@/lib/db";
import { OrganizationDetails } from "@/components/organizations/OrganizationDetails";

async function getOrganization(id: string) {
  const drizzle = getDbClient();

  const [org] = await drizzle
    .select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      slug: schema.organizations.slug,
      createdAt: schema.organizations.createdAt,
      updatedAt: schema.organizations.updatedAt,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, id))
    .limit(1);

  if (!org) return null;

  // Get Odoo database
  const [odooDb] = await drizzle
    .select()
    .from(schema.odooDatabases)
    .where(eq(schema.odooDatabases.organizationId, id))
    .limit(1);

  // Get members count
  const members = await drizzle
    .select({
      id: schema.members.id,
      userId: schema.members.userId,
      role: schema.members.role,
      user: {
        name: schema.users.name,
        email: schema.users.email,
      },
    })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
    .where(eq(schema.members.organizationId, id));

  // Get Odoo users if database exists
  let odooUsers: typeof schema.odooUsers.$inferSelect[] = [];
  if (odooDb) {
    odooUsers = await drizzle
      .select()
      .from(schema.odooUsers)
      .where(eq(schema.odooUsers.odooDatabaseId, odooDb.id));
  }

  return {
    ...org,
    odooDatabase: odooDb,
    members,
    odooUsers,
  };
}

export default async function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const organization = await getOrganization(id);

  if (!organization) {
    notFound();
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/organizations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Organization details and Odoo database management</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <OrganizationDetails organization={organization} />
      </div>
    </div>
  );
}
