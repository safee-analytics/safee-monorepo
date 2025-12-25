"use client";

import { Pencil, Trash2, Mail, Shield, Ban, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { schema } from "@safee/database";

type User = typeof schema.users.$inferSelect;

export function UsersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-600">Try adjusting your search query</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name || "Unnamed User"}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-900">{user.email}</div>
                  {user.emailVerified && (
                    <span title="Email verified">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "super_admin"
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.role === "super_admin" && <Shield className="h-3 w-3" />}
                  {user.role || "user"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.banned ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Ban className="h-3 w-3" />
                    Banned
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(user.createdAt), "MMM d, yyyy")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => router.push(`/users/${user.id}`)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Edit user"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(user.id, user.email)}
                    disabled={deletingId === user.id}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Delete user"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
