"use client";

import { useState } from "react";
import { Shield, Plus, Edit2, Trash2, ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";
import {
  useSession,
  useOrganizationRoles,
  useOrganizationMembers,
  useCreateRole,
  useUpdateRolePermissions,
  useDeleteRole,
} from "@/lib/api/hooks";

const AVAILABLE_PERMISSIONS = [
  // Audit Module
  { id: "audit:cases:read", label: "View Cases", module: "Audit" },
  { id: "audit:cases:write", label: "Create/Edit Cases", module: "Audit" },
  { id: "audit:cases:delete", label: "Delete Cases", module: "Audit" },
  { id: "audit:cases:assign", label: "Assign Cases", module: "Audit" },

  // Hisabiq (Accounting) Module
  { id: "hisabiq:invoices:read", label: "View Invoices", module: "Hisabiq" },
  { id: "hisabiq:invoices:write", label: "Create/Edit Invoices", module: "Hisabiq" },
  { id: "hisabiq:accounts:read", label: "View Accounts", module: "Hisabiq" },
  { id: "hisabiq:accounts:write", label: "Manage Accounts", module: "Hisabiq" },

  // Kanz (HR) Module
  { id: "kanz:employees:read", label: "View Employees", module: "Kanz" },
  { id: "kanz:employees:write", label: "Manage Employees", module: "Kanz" },
  { id: "kanz:payroll:read", label: "View Payroll", module: "Kanz" },
  { id: "kanz:payroll:write", label: "Process Payroll", module: "Kanz" },

  // Nisbah (CRM) Module
  { id: "nisbah:contacts:read", label: "View Contacts", module: "Nisbah" },
  { id: "nisbah:contacts:write", label: "Manage Contacts", module: "Nisbah" },
  { id: "nisbah:deals:read", label: "View Deals", module: "Nisbah" },
  { id: "nisbah:deals:write", label: "Manage Deals", module: "Nisbah" },

  // System
  { id: "system:users:manage", label: "Manage Users", module: "System" },
  { id: "system:roles:manage", label: "Manage Roles", module: "System" },
  { id: "system:settings:write", label: "Change Settings", module: "System" },
];

export default function RoleManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const { data: session } = useSession();
  const orgId = session?.session.activeOrganizationId;

  const { data: roles, isLoading } = useOrganizationRoles(orgId || "");
  const { data: members } = useOrganizationMembers(orgId || "");
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRolePermissions();
  const deleteRoleMutation = useDeleteRole();

  const groupedRoles = (roles || []).reduce(
    (acc, role) => {
      if (!acc[role.role]) {
        acc[role.role] = [];
      }
      acc[role.role].push(role);
      return acc;
    },
    {} as Record<string, typeof roles>,
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
    ).then(() => {
      setShowCreateModal(false);
      // TODO: Show success toast
    });
  };

  const handleUpdateRole = (roleName: string, permissions: string[]) => {
    if (!orgId) return;

    const existingRoles = groupedRoles[roleName] || [];

    updateRoleMutation
      .mutateAsync({
        orgId,
        role: roleName,
        permissions,
      })
      .then(() => {
        setEditingRole(null);
      })
      .catch(() => {
        Promise.all(existingRoles.map((r) => deleteRoleMutation.mutateAsync({ orgId, roleId: r.id })))
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
          });
      });
  };

  const handleDeleteRole = (roleName: string) => {
    if (!orgId) return;
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) return;

    const rolesToDelete = groupedRoles[roleName] || [];
    Promise.all(rolesToDelete.map((r) => deleteRoleMutation.mutateAsync({ orgId, roleId: r.id })));
  };

  const getRolePermissions = (roleName: string): string[] => {
    return (groupedRoles[roleName] || []).map((r) => r.permission);
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
          onClick={() => setShowCreateModal(true)}
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
                      onClick={() => setEditingRole(isEditing ? null : roleName)}
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
                      onSave={(newPermissions) => handleUpdateRole(roleName, newPermissions)}
                      onCancel={() => setEditingRole(null)}
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
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
          isCreating={createRoleMutation.isPending}
        />
      )}
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
  const permissionsByModule = AVAILABLE_PERMISSIONS.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_PERMISSIONS>,
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
                onChange={() => togglePermission(perm.id)}
                className="rounded border-gray-300"
              />
              {perm.label}
            </label>
          ))}
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(selectedPermissions)}
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

  const permissionsByModule = AVAILABLE_PERMISSIONS.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, typeof AVAILABLE_PERMISSIONS>,
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
                onChange={(e) => setRoleName(e.target.value)}
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
                            onChange={() => togglePermission(perm.id)}
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
