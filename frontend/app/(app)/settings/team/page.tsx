"use client";

import { useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  Clock,
  Shield,
  UserPlus,
  AlertCircle,
  X,
  RefreshCw,
  Mail,
} from "lucide-react";
import {
  useSession,
  useOrganizationMembers,
  useOrganizationInvitations,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
  useAssignableRoles,
  useManageableUsers,
  useCancelInvitation,
} from "@/lib/api/hooks";
import Link from "next/link";
import { useToast, useConfirm, SafeeToastContainer } from "@/components/feedback";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { type Member, type Invitation, memberSchema, invitationSchema } from "@/lib/validation";

export default function TeamManagement() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: session } = useSession();
  const orgId = session?.session.activeOrganizationId;

  const { data: membersData, isLoading } = useOrganizationMembers(orgId!);
  const { data: invitationsData } = useOrganizationInvitations(orgId!);

  const members: Member[] = memberSchema.array().parse(membersData || []);
  const invitations: Invitation[] = invitationSchema.array().parse(invitationsData || []);

  const inviteMemberMutation = useInviteMember();
  const removeMemberMutation = useRemoveMember();
  const updateMemberRoleMutation = useUpdateMemberRole();
  const cancelInvitationMutation = useCancelInvitation();

  // Hierarchical permissions
  const assignableRoles = useAssignableRoles();
  const manageableUserIds = useManageableUsers();

  // Calculate statistics
  const totalUsers = members.length;
  const adminCount = members.filter((m) => m.role === "admin" || m.role === "owner").length;
  const pendingInvitesCount = invitations.length;

  // For now, consider all members as active since we don't have lastActiveAt field
  // TODO: [Backend] - Add lastActiveAt field to member schema and filter by recent activity
//   Details: The `lastActiveAt` field should be added to the member schema on the backend to track user activity. This will allow for more accurate calculation of active users.
//   Priority: Medium
  const activeUsers = totalUsers;

  // Calculate activity rate (active / total)
  const activityRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const stats = {
    totalUsers,
    totalUsersChange: t.settings.team.stats.noHistoricalData, // TODO: [Backend] - Implement after adding member creation timestamps
//   Details: To calculate the change in total users, a `createdAt` timestamp should be added to the member schema on the backend. This will allow for historical data analysis.
//   Priority: Medium
    activeUsers,
    activityRate: `${activityRate}% ${t.settings.team.stats.active}`,
    pendingInvites: pendingInvitesCount,
    pendingNote:
      pendingInvitesCount === 1
        ? `1 ${t.settings.team.stats.pending}`
        : `${pendingInvitesCount} ${t.settings.team.stats.pending}`,
    adminRoles: adminCount,
    adminNote: t.settings.team.stats.adminOwner,
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-red-100 text-red-700",
      admin: "bg-blue-100 text-blue-700",
      manager: "bg-purple-100 text-purple-700",
      member: "bg-green-100 text-green-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  const filteredMembers = (members || []).filter((member) => {
    const matchesSearch =
      searchQuery === "" ||
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Check if user can manage a specific member
  const canManage = (userId: string) => manageableUserIds.includes(userId);

  const handleInviteMember = (email: string, role: string, name?: string) => {
    if (!orgId) return;
    inviteMemberMutation.mutate(
      { orgId, invitation: { email, role, name } },
      {
        onSuccess: () => {
          setShowInviteModal(false);
          toast.success(t.settings.team.alerts.inviteSent);
        },
        onError: () => {
          toast.error(t.settings.team.alerts.inviteError);
        },
      },
    );
  };

  const handleRemoveMember = async (userId: string) => {
    if (!orgId) return;
    if (!canManage(userId)) {
      toast.error(t.settings.team.alerts.noRemovePermission);
      return;
    }
    const confirmed = await confirm({
      title: t.settings.team.alerts.confirmRemoveTitle,
      message: t.settings.team.alerts.confirmRemove,
      type: "danger",
      confirmText: t.settings.team.alerts.remove,
    });
    if (confirmed) {
      removeMemberMutation.mutate(
        { orgId, userId },
        {
          onSuccess: () => {
            toast.success(t.settings.team.alerts.memberRemoved);
          },
          onError: () => {
            toast.error(t.settings.team.alerts.removeError);
          },
        },
      );
    }
  };

  const handleUpdateRole = (userId: string, newRole: string) => {
    if (!orgId) return;
    if (!canManage(userId)) {
      toast.error(t.settings.team.alerts.noChangeRolePermission);
      return;
    }
    if (!assignableRoles.includes(newRole)) {
      toast.error(t.settings.team.alerts.noAssignRolePermission);
      return;
    }
    updateMemberRoleMutation.mutate(
      { orgId, userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(t.settings.team.alerts.roleUpdated);
        },
        onError: () => {
          toast.error(t.settings.team.alerts.roleUpdateError);
        },
      },
    );
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!orgId) return;
    const confirmed = await confirm({
      title: t.settings.team.alerts.confirmCancelInvitationTitle,
      message: t.settings.team.alerts.confirmCancelInvitation,
      type: "warning",
      confirmText: t.settings.team.alerts.cancel,
    });
    if (confirmed) {
      cancelInvitationMutation.mutate(
        { orgId, invitationId },
        {
          onSuccess: () => {
            toast.success(t.settings.team.alerts.invitationCancelled);
          },
          onError: () => {
            toast.error(t.settings.team.alerts.invitationCancelError);
          },
        },
      );
    }
  };

  const handleResendInvitation = (email: string, role: string) => {
    if (!orgId) return;
    // Cancel existing and resend
    inviteMemberMutation.mutate(
      { orgId, invitation: { email, role } },
      {
        onSuccess: () => {
          toast.success(t.settings.team.alerts.invitationResent);
        },
        onError: () => {
          toast.error(t.settings.team.alerts.invitationResendError);
        },
      },
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.settings.team.title}</h1>
          <p className="text-gray-600 mt-1">{t.settings.team.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings/team/roles"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            {t.settings.team.manageRoles}
          </Link>
          <button
            onClick={() => {
              setShowInviteModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {t.settings.team.inviteMember}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t.settings.team.stats.totalMembers}</p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-green-600 mt-1">{stats.totalUsersChange}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t.settings.team.stats.activeMembers}</p>
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.activityRate}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t.settings.team.stats.pendingInvites}</p>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pendingInvites}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.pendingNote}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{t.settings.team.stats.adminRoles}</p>
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.adminRoles}</p>
          <p className="text-sm text-gray-600 mt-1">{stats.adminNote}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.settings.team.search}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t.settings.team.filters.allRoles}</option>
            <option value="owner">{t.settings.team.filters.owner}</option>
            <option value="admin">{t.settings.team.filters.admin}</option>
            <option value="manager">{t.settings.team.filters.manager}</option>
            <option value="member">{t.settings.team.filters.member}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {t.settings.team.table.member}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {t.settings.team.table.role}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {t.settings.team.table.joined}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {t.settings.team.table.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {t.settings.team.table.loading}
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {t.settings.team.table.noMembers}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.email}`}
                          alt={member.user.name || member.user.email}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user.name || t.settings.team.table.unknown}
                          </p>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManage(member.userId) ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={member.role}
                            onChange={(e) => {
                              handleUpdateRole(member.userId, e.target.value);
                            }}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            {/* Show current role even if not assignable */}
                            <option value={member.role} disabled>
                              {member.role}
                            </option>
                            {/* Show assignable roles */}
                            {assignableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              void handleRemoveMember(member.userId);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {t.settings.team.table.remove}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-gray-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">{t.settings.team.table.noPermission}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t.settings.team.invitations.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{t.settings.team.invitations.subtitle}</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                {invitations.length} {t.settings.team.invitations.pending}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {t.settings.team.invitations.email}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {t.settings.team.invitations.role}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {t.settings.team.invitations.sent}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {t.settings.team.invitations.status}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    {t.settings.team.invitations.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-600">
                            {t.settings.team.invitations.pendingInvitation}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}
                      >
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700">
                        {invitation.status || t.settings.team.invitations.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            void handleResendInvitation(invitation.email, invitation.role);
                          }}
                          disabled={inviteMemberMutation.isPending}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title={t.settings.team.invitations.resendTitle}
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t.settings.team.invitations.resend}
                        </button>
                        <button
                          onClick={() => {
                            void handleCancelInvitation(invitation.id);
                          }}
                          disabled={cancelInvitationMutation.isPending}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title={t.settings.team.invitations.cancelTitle}
                        >
                          <X className="w-4 h-4" />
                          {t.settings.team.invitations.cancel}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t.settings.team.inviteModal.title}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email");
                const role = formData.get("role");
                const name = formData.get("name");

                if (typeof email === "string" && typeof role === "string" && role) {
                  handleInviteMember(email, role, typeof name === "string" ? name : undefined);
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.settings.team.inviteModal.email}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t.settings.team.inviteModal.emailPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.settings.team.inviteModal.name}
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={t.settings.team.inviteModal.namePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.settings.team.inviteModal.role}
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {assignableRoles.length === 0 ? (
                      <option value="">{t.settings.team.inviteModal.noRoles}</option>
                    ) : (
                      assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">{t.settings.team.inviteModal.roleNote}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t.settings.team.inviteModal.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={inviteMemberMutation.isPending}
                >
                  {inviteMemberMutation.isPending
                    ? t.settings.team.inviteModal.sending
                    : t.settings.team.inviteModal.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </div>
  );
}
