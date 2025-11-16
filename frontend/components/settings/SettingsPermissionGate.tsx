"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { useUserProfile, useOrganizationMembers } from "@/lib/api/hooks";

interface SettingsPermissionGateProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function SettingsPermissionGate({
  children,
  allowedRoles = ["owner", "admin"],
}: SettingsPermissionGateProps) {
  // Get current user profile
  const { data: currentUser, isLoading: userLoading } = useUserProfile();
  const orgId = currentUser?.organizationId;

  // Get organization members to find user's role
  const { data: members, isLoading: membersLoading } = useOrganizationMembers(orgId || "");

  const isLoading = userLoading || membersLoading;

  // Find current user's role in the organization
  const currentMember = members?.find((m) => m.userId === currentUser?.id);
  const userRole = currentMember?.role || "user";
  const hasPermission = allowedRoles.includes(userRole);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasPermission) {
    return (
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-2">Access Restricted</h2>
                <p className="text-red-700 mb-4">
                  You don't have permission to access this settings page. Only organization owners and
                  administrators can view and modify these settings.
                </p>
                <div className="bg-red-100 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">Your current role:</span>{" "}
                    <span className="capitalize">{userRole || "Guest"}</span>
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    <span className="font-semibold">Required roles:</span>{" "}
                    {allowedRoles.map((role, idx) => (
                      <span key={role}>
                        <span className="capitalize">{role}</span>
                        {idx < allowedRoles.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>
                </div>
                <p className="text-sm text-red-600">
                  If you believe this is an error, please contact your organization administrator.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Has permission - render children
  return <>{children}</>;
}
