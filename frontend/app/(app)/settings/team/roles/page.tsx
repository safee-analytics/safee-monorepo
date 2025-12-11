"use client";

import { useState } from "react";
import { Shield, Plus, Edit2, Trash2, ArrowLeft, Check, X } from "lucide-react";
import { useConfirm, useToast, SafeeToastContainer } from "@/components/feedback";
import Link from "next/link";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import {
  useSession,
  useOrganizationRoles,
  useOrganizationMembers,
  useCreateRole,
  useUpdateRolePermissions,
  useDeleteRole,
} from "@/lib/api/hooks";

const AVAILABLE_PERMISSIONS = [
  // Settings & Administration
  { id: "settings:view", label: "View Settings", module: "Settings" },
  { id: "settings:manage", label: "Manage All Settings", module: "Settings" },
  { id: "organization:view", label: "View Organization", module: "Organization" },
  { id: "organization:update", label: "Update Organization", module: "Organization" },
  { id: "organization:delete", label: "Delete Organization", module: "Organization" },
  { id: "organization:transfer", label: "Transfer Ownership", module: "Organization" },
  { id: "team:view", label: "View Team", module: "Team" },
  { id: "team:invite", label: "Invite Members", module: "Team" },
  { id: "team:remove", label: "Remove Members", module: "Team" },
  { id: "team:update_roles", label: "Update Roles", module: "Team" },
  { id: "auditLogs:view", label: "View Audit Logs", module: "Security" },
  { id: "auditLogs:export", label: "Export Audit Logs", module: "Security" },
  { id: "security:view", label: "View Security Settings", module: "Security" },
  { id: "security:manage", label: "Manage Security", module: "Security" },
  { id: "storage:view", label: "View Storage", module: "System" },
  { id: "storage:manage", label: "Manage Storage", module: "System" },
  { id: "integrations:view", label: "View Integrations", module: "System" },
  { id: "integrations:manage", label: "Manage Integrations", module: "System" },
  { id: "api:view", label: "View API Keys", module: "System" },
  { id: "api:create", label: "Create API Keys", module: "System" },
  { id: "api:revoke", label: "Revoke API Keys", module: "System" },
  { id: "database:view", label: "View Database", module: "System" },
  { id: "database:manage", label: "Manage Database", module: "System" },
  { id: "invoiceStyles:view", label: "View Invoice Styles", module: "Settings" },
  { id: "invoiceStyles:manage", label: "Manage Invoice Styles", module: "Settings" },

  // Audit Module
  { id: "audit:view", label: "View Audit Module", module: "Audit" },
  { id: "audit:create", label: "Create Audit Cases", module: "Audit" },
  { id: "audit:update", label: "Update Audit Cases", module: "Audit" },
  { id: "audit:delete", label: "Delete Audit Cases", module: "Audit" },
  { id: "audit:assign", label: "Assign Audit Cases", module: "Audit" },

  // Accounting Module (Hisabiq)
  { id: "accounting:view", label: "View Accounting", module: "Accounting" },
  { id: "accounting:create", label: "Create Transactions", module: "Accounting" },
  { id: "accounting:update", label: "Update Transactions", module: "Accounting" },
  { id: "accounting:delete", label: "Delete Transactions", module: "Accounting" },
  { id: "accounting:export", label: "Export Accounting Data", module: "Accounting" },

  // HR Module (Kanz)
  { id: "hr:view", label: "View HR Data", module: "HR" },
  { id: "hr:create", label: "Create Employee Records", module: "HR" },
  { id: "hr:update", label: "Update Employee Records", module: "HR" },
  { id: "hr:delete", label: "Delete Employee Records", module: "HR" },
  { id: "hr:manage_payroll", label: "Manage Payroll", module: "HR" },

  // CRM Module (Nisbah)
  { id: "crm:view", label: "View CRM Data", module: "CRM" },
  { id: "crm:create", label: "Create Contacts/Deals", module: "CRM" },
  { id: "crm:update", label: "Update Contacts/Deals", module: "CRM" },
  { id: "crm:delete", label: "Delete Contacts/Deals", module: "CRM" },
];

export default function RoleManagement() {
  const { t } = useTranslation();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const { data: session } = useSession();
  const orgId = session?.session.activeOrganizationId;

  const { data: roles, isLoading } = useOrganizationRoles(orgId || "");
  const { data: members } = useOrganizationMembers(orgId || "");
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRolePermissions();
  const deleteRoleMutation = useDeleteRole();

  const groupedRoles = (roles || []).reduce<Record<string, NonNullable<typeof roles>>>(
    (acc, role) => {
      if (!acc[role.role]) {
        acc[role.role] = [];
      }
      acc[role.role].push(role);
      return acc;
    },
    {},
  );

  const handleCreateRole = (roleName: string, permissions: string[]) => {
    if (!orgId) return;

    Promise.all(
      permissions.map((permission) =>
        createRoleMutation.mutateAsync({
          orgId,
          role: roleName,
          permission,
        }),
      ),
    )
      .then(() => {
        setShowCreateModal(false);
        toast.success(t.settings.team.roles.roleCreated);
      })
      .catch(() => {
        toast.error(t.settings.team.roles.roleCreateError);
      });
  };

  const handleUpdateRole = (roleName: string, permissions: string[]) => {
    if (!orgId) return;

    const existingRoles = groupedRoles[roleName] || [];
    const roleId = existingRoles[0]?.id;
    if (!roleId) return;

    updateRoleMutation
      .mutateAsync({
        orgId,
        roleName,
        permissions,
      })
      .then(() => {
        setEditingRole(null);
        toast.success(t.settings.team.roles.roleUpdated);
      })
      .catch(() => {
        Promise.all(existingRoles.map((r) => deleteRoleMutation.mutateAsync({ orgId, roleName: r.role })))
          .then(() =>
            Promise.all(
              permissions.map((permission) =>
                createRoleMutation.mutateAsync({
                  orgId,
                  role: roleName,
                  permission,
                }),
              ),
            ),
          )
          .then(() => {
            setEditingRole(null);
            toast.success(t.settings.team.roles.roleUpdated);
          })
          .catch(() => {
            toast.error(t.settings.team.roles.roleUpdateError);
          });
      });
  };

  const handleDeleteRole = async (roleName: string) => {
    if (!orgId) return;
    const confirmed = await confirm({
      title: t.settings.team.roles.confirmDeleteTitle,
      message: t.settings.team.roles.confirmDelete.replace("{roleName}", roleName),
      type: "danger",
      confirmText: t.settings.team.roles.delete,
    });
    if (!confirmed) return;

    const rolesToDelete = groupedRoles[roleName] || [];
    Promise.all(rolesToDelete.map((r) => deleteRoleMutation.mutateAsync({ orgId, roleName: r.role })))
      .then(() => {
        toast.success(t.settings.team.roles.roleDeleted);
      })
      .catch(() => {
        toast.error(t.settings.team.roles.roleDeleteError);
      });
  };

  const getRolePermissions = (roleName: string): string[] => {
    const roleGroup = groupedRoles[roleName];
    if (!roleGroup) return [];
    // Flatten permission objects to string arrays
    const permissions: string[] = [];
    for (const r of roleGroup) {
      if (typeof r.permission === "string") {
        permissions.push(r.permission);
      } else if (typeof r.permission === "object" && r.permission !== null) {
        // Permission is Record<string, string[]>, flatten to "resource:action" format
        for (const [resource, actions] of Object.entries(r.permission)) {
          if (Array.isArray(actions)) {
            for (const action of actions) permissions.push(`${resource}:${action}`);
          }
        }
      }
    }
    return permissions;
  };

  const getRoleUserCount = (roleName: string): number => {
    if (!members) return 0;
    return members.filter((member) => member.role === roleName).length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/team" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-600 mt-1">Define roles and assign permissions across modules</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-gray-500">Loading roles...</div>
        ) : Object.keys(groupedRoles).length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No roles defined yet. Create your first role to get started.
          </div>
        ) : (
          Object.keys(groupedRoles).map((roleName) => {
            const permissions = getRolePermissions(roleName);
            const userCount = getRoleUserCount(roleName);
            const isEditing = editingRole === roleName;

            return (
              <div key={roleName} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{roleName}</h3>
                      <p className="text-sm text-gray-600">{userCount} members</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingRole(isEditing ? null : roleName); }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isEditing ? (
                        <X className="w-4 h-4 text-gray-600" />
                      ) : (
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteRole(roleName)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Permissions</p>
                  {isEditing ? (
                    <RolePermissionEditor
                      initialPermissions={permissions}
                      onSave={(newPermissions) => { handleUpdateRole(roleName, newPermissions); }}
                      onCancel={() => { setEditingRole(null); }}
                    />
                  ) : (
                    <div className="space-y-1">
                      {permissions.length === 0 ? (
                        <p className="text-sm text-gray-500">No permissions assigned</p>
                      ) : (
                        permissions.slice(0, 5).map((permission) => {
                          const permInfo = AVAILABLE_PERMISSIONS.find((p) => p.id === permission);
                          return (
                            <div key={permission} className="flex items-center gap-2 text-sm text-gray-700">
                              <Check className="w-3 h-3 text-green-600" />
                              {permInfo?.label || permission}
                            </div>
                          );
                        })
                      )}
                      {permissions.length > 5 && (
                        <p className="text-xs text-gray-500">+{permissions.length - 5} more...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <CreateRoleModal
          onClose={() => { setShowCreateModal(false); }}
          onCreate={handleCreateRole}
          isCreating={createRoleMutation.isPending}
        />
      )}
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}

// Component for editing role permissions
function RolePermissionEditor({
  initialPermissions,
  onSave,
  onCancel,
}: {
  initialPermissions: string[];
  onSave: (permissions: string[]) => void;
  onCancel: () => void;
}) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(initialPermissions);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId],
    );
  };

  // Group by module
  const permissionsByModule = AVAILABLE_PERMISSIONS.reduce<Record<string, typeof AVAILABLE_PERMISSIONS>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-3">
      {Object.entries(permissionsByModule).map(([module, perms]) => (
        <div key={module} className="space-y-1">
          <p className="text-xs font-medium text-gray-500">{module}</p>
          {perms.map((perm) => (
            <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm.id)}
                onChange={() => { togglePermission(perm.id); }}
                className="rounded border-gray-300"
              />
              {perm.label}
            </label>
          ))}
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => { onSave(selectedPermissions); }}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Component for creating a new role
function CreateRoleModal({
  onClose,
  onCreate,
  isCreating,
}: {
  onClose: () => void;
  onCreate: (roleName: string, permissions: string[]) => void;
  isCreating: boolean;
}) {
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId],
    );
  };

  const permissionsByModule = AVAILABLE_PERMISSIONS.reduce<Record<string, typeof AVAILABLE_PERMISSIONS>>(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {},
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roleName && selectedPermissions.length > 0) {
      onCreate(roleName, selectedPermissions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Role</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => { setRoleName(e.target.value); }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Audit Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="space-y-2">
                    <p className="font-medium text-sm text-gray-900">{module}</p>
                    <div className="space-y-1 ml-4">
                      {perms.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => { togglePermission(perm.id); }}
                            className="rounded border-gray-300"
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">{selectedPermissions.length} permissions selected</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={isCreating || !roleName || selectedPermissions.length === 0}
            >
              {isCreating ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
