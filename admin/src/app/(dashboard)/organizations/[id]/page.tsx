import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getDbClient } from "@/lib/db";
import { OrganizationDetails } from "@/components/organizations/OrganizationDetails";

export const dynamic = "force-dynamic";

async function getOrganization(id: string) {
  const db = getDbClient();

  const organization = await db.query.organizations.findFirst({
    where: (org, { eq }) => eq(org.id, id),
    with: {
      odooDatabase: {
        with: {
          odooUsers: true,
        },
      },
      members: {
        with: {
          user: true,
        },
      },
    },
  });

  if (!organization) return null;

  // Flatten the structure to match component expectations
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
    odooDatabase: organization.odooDatabase ?? null,
    members: organization.members,
    odooUsers: organization.odooDatabase?.odooUsers ?? [],
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
