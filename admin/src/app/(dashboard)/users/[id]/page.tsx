import { schema, eq } from "@safee/database";
import { notFound } from "next/navigation";
import { UserEditForm } from "@/components/users/UserEditForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getDbClient } from "@/lib/db";

async function getUser(id: string) {
  const drizzle = getDbClient();

  const [user] = await drizzle.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);

  return user;
}

export default async function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/users" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-1 text-sm text-gray-600">Update user information and permissions</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-2xl">
          <div className="rounded-xl bg-white shadow-sm border border-gray-200/60 p-6">
            <UserEditForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
