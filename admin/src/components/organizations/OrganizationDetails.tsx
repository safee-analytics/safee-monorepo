"use client";

import { Building2, Database, Users, Calendar, Server, RefreshCw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  odooDatabase: {
    id: string;
    dbName: string;
    status: string;
    createdAt: Date;
  } | null;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  odooUsers: Array<{
    id: string;
    odooUid: number;
    odooLogin: string;
    userId: string;
  }>;
};

export function OrganizationDetails({ organization }: { organization: Organization }) {
  const router = useRouter();
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleProvisionOdoo = async () => {
    if (!confirm(`Provision new Odoo database for "${organization.name}"?`)) {
      return;
    }

    setIsProvisioning(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/provision-odoo`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to provision Odoo database");
      }

      alert("Odoo database provisioning started. This may take several minutes.");
      router.refresh();
    } catch (error) {
      console.error("Error provisioning Odoo:", error);
      alert(error instanceof Error ? error.message : "Failed to provision Odoo database");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleSyncOdoo = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/sync-odoo`, {
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
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Organization Info Card */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{organization.name}</h2>
              <p className="text-sm text-gray-500">{organization.slug}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Created {format(new Date(organization.createdAt), "MMM d, yyyy")}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Members</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{organization.members.length}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Database className="h-4 w-4" />
              <span className="text-sm font-medium">Odoo Users</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{organization.odooUsers.length}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Last Updated</span>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {format(new Date(organization.updatedAt), "MMM d, yyyy")}
            </div>
          </div>
        </div>
      </div>

      {/* Odoo Database Card */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200/60 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Odoo Database</h3>
          </div>
          {organization.odooDatabase ? (
            organization.odooDatabase.status === "active" && (
              <button
                onClick={handleSyncOdoo}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </button>
            )
          ) : (
            <button
              onClick={handleProvisionOdoo}
              disabled={isProvisioning}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <Server className="h-4 w-4" />
                  Provision Odoo
                </>
              )}
            </button>
          )}
        </div>

        {organization.odooDatabase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Database Name</label>
                <p className="text-sm text-gray-900 font-mono">{organization.odooDatabase.dbName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <p className="text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      organization.odooDatabase.status === "active"
                        ? "bg-green-100 text-green-800"
                        : organization.odooDatabase.status === "provisioning"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {organization.odooDatabase.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-sm text-gray-900">
                  {format(new Date(organization.odooDatabase.createdAt), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No Odoo database provisioned yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Click "Provision Odoo" to create a new database
            </p>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-200/60 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Members</h3>
        <div className="space-y-3">
          {organization.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
