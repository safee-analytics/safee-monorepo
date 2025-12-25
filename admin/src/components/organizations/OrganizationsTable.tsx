"use client";

import { Pencil, Trash2, Building2, Database, RefreshCw, CheckCircle, Loader2, Server } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  odooDatabase: {
    id: string;
    databaseName: string;
    isActive: Date;
    createdAt: Date;
  } | null;
};

export function OrganizationsTable({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete organization "${name}"? This will also delete all associated data.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete organization");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Failed to delete organization");
    } finally {
      setDeletingId(null);
    }
  };

  const handleProvisionOdoo = async (orgId: string, orgName: string) => {
    if (!confirm(`Provision new Odoo database for "${orgName}"?`)) {
      return;
    }

    setProvisioningId(orgId);
    try {
      const response = await fetch(`/api/organizations/${orgId}/provision-odoo`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to provision Odoo database");
      }

      alert("Odoo database provisioning started. This may take a few minutes.");
      router.refresh();
    } catch (error) {
      console.error("Error provisioning Odoo:", error);
      alert(error instanceof Error ? error.message : "Failed to provision Odoo database");
    } finally {
      setProvisioningId(null);
    }
  };

  const handleSyncOdoo = async (orgId: string, dbId: string) => {
    setSyncingId(dbId);
    try {
      const response = await fetch(`/api/organizations/${orgId}/sync-odoo`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync Odoo database");
      }

      alert("Odoo sync job started successfully");
      router.refresh();
    } catch (error) {
      console.error("Error syncing Odoo:", error);
      alert("Failed to sync Odoo database");
    } finally {
      setSyncingId(null);
    }
  };

  const getStatusBadge = (isActive: Date | undefined) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Database
        </span>
      );
    }

    // Check if timestamp is set (database is active)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  };

  if (organizations.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
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
              Organization
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Slug
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Odoo Database
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
          {organizations.map((org) => (
            <tr key={org.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{org.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{org.slug}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {org.odooDatabase ? (
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-gray-900">{org.odooDatabase.databaseName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(org.odooDatabase?.isActive)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(org.createdAt), "MMM d, yyyy")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  {!org.odooDatabase ? (
                    <button
                      onClick={() => void handleProvisionOdoo(org.id, org.name)}
                      disabled={provisioningId === org.id}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50 disabled:opacity-50"
                      title="Provision Odoo"
                    >
                      {provisioningId === org.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Server className="h-4 w-4" />
                      )}
                      <span className="text-xs">Provision</span>
                    </button>
                  ) : org.odooDatabase.isActive ? (
                    <button
                      onClick={() => void handleSyncOdoo(org.id, org.odooDatabase!.id)}
                      disabled={syncingId === org.odooDatabase.id}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 disabled:opacity-50"
                      title="Sync Odoo"
                    >
                      {syncingId === org.odooDatabase.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={() => router.push(`/organizations/${org.id}`)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                    title="Edit organization"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(org.id, org.name)}
                    disabled={deletingId === org.id}
                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Delete organization"
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
