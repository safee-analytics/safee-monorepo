/**
 * Admin Hooks for Better Auth
 *
 * These hooks provide admin-only functionality:
 * - Ban/unban users
 * - Impersonate users
 * - List all users (admin view)
 * - Delete users (admin action)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";

// ============================================================================
// Query Keys
// ============================================================================

export const adminQueryKeys = {
  users: ["admin", "users"] as const,
  user: (userId: string) => ["admin", "users", userId] as const,
  bannedUsers: ["admin", "users", "banned"] as const,
} as const;

// ============================================================================
// User Ban Management
// ============================================================================

/**
 * Ban a user (admin only)
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; reason?: string; expiresAt?: Date }) => {
      const { data: result, error } = await authClient.admin.banUser({
        userId: data.userId,
        banReason: data.reason,
        banExpiresIn: data.expiresAt ? Math.floor((data.expiresAt.getTime() - Date.now()) / 1000) : undefined,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.bannedUsers });
    },
  });
}

/**
 * Unban a user (admin only)
 */
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.unbanUser({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.bannedUsers });
    },
  });
}

// ============================================================================
// User Impersonation
// ============================================================================

/**
 * Impersonate a user (admin only)
 * Allows admin to act as another user for troubleshooting
 */
export function useImpersonateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.impersonateUser({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Refresh session to reflect impersonated user
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

/**
 * Stop impersonating and return to admin account
 */
export function useStopImpersonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.admin.stopImpersonating({});
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      // Refresh session to reflect original admin user
      void queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}

// ============================================================================
// User Management (Admin)
// ============================================================================

/**
 * List all users (admin only)
 */
export function useListAllUsers(options?: {
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "email" | "name";
  sortDirection?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: [...adminQueryKeys.users, options] as const,
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: options?.limit?.toString(),
          offset: options?.offset?.toString(),
          sortBy: options?.sortBy,
          sortDirection: options?.sortDirection,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Get user details (admin view with additional info)
 * Note: better-auth doesn't have a getUser method, using listUsers with email filter
 */
export function useAdminGetUser(userId: string) {
  return useQuery({
    queryKey: adminQueryKeys.user(userId),
    queryFn: async () => {
      // Use listUsers to find the specific user
      const { data, error } = await authClient.admin.listUsers({
        query: {
          filterField: "id",
          filterValue: userId,
          filterOperator: "eq",
        },
      });
      if (error) throw new Error(error.message);
      return data?.users?.[0] ?? null;
    },
    enabled: !!userId,
  });
}

/**
 * Delete user account (admin only)
 * Note: better-auth uses removeUser instead of deleteUser
 */
export function useAdminDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.removeUser({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
    },
  });
}

/**
 * Update user details (admin only)
 */
export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      email?: string;
      name?: string;
      emailVerified?: boolean;
      role?: string;
    }) => {
      const { data: result, error } = await authClient.admin.updateUser({
        userId: data.userId,
        data: {
          email: data.email,
          name: data.name,
          emailVerified: data.emailVerified,
          role: data.role,
        },
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
    },
  });
}

/**
 * List banned users only (admin only)
 */
export function useListBannedUsers() {
  return useQuery({
    queryKey: adminQueryKeys.bannedUsers,
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: {
          filterField: "banned",
          filterValue: true,
          filterOperator: "eq",
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Create user as admin (bypass email verification)
 */
export function useAdminCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name?: string;
      emailVerified?: boolean;
      role?: string;
    }) => {
      const { data: result, error } = await authClient.admin.createUser({
        email: data.email,
        password: data.password,
        name: data.name || "",
        role: (data.role || "user") as "user" | "admin",
        data: {
          emailVerified: data.emailVerified ?? true,
        },
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
    },
  });
}

/**
 * Set user's email as verified (admin only)
 * Note: better-auth doesn't have setEmailVerified, using updateUser instead
 */
export function useAdminVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.updateUser({
        userId,
        data: {
          emailVerified: true,
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
    },
  });
}

/**
 * Reset user's password (admin only)
 */
export function useAdminResetPassword() {
  return useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const { data: result, error } = await authClient.admin.setUserPassword({
        userId: data.userId,
        newPassword: data.newPassword,
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}

// ============================================================================
// Role Management (Admin)
// ============================================================================

/**
 * Set user role (admin only)
 */
export function useAdminSetRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const { data: result, error } = await authClient.admin.setRole({
        userId: data.userId,
        role: data.role as "admin" | "user",
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(variables.userId) });
    },
  });
}

/**
 * Check if user has specific permission (admin)
 */
export function useAdminHasPermission() {
  return useMutation({
    mutationFn: async (data: {
      userId: string;
      permission: {
        user?: (
          | "list"
          | "update"
          | "delete"
          | "create"
          | "set-role"
          | "ban"
          | "impersonate"
          | "set-password"
          | "get"
        )[];
        session?: ("list" | "delete" | "revoke")[];
      };
    }) => {
      const { data: result, error } = await authClient.admin.hasPermission({
        userId: data.userId,
        permission: data.permission,
      });
      if (error) throw new Error(error.message);
      return result;
    },
  });
}

// ============================================================================
// Session Management (Admin)
// ============================================================================

/**
 * List all sessions for a specific user (admin only)
 */
export function useAdminListUserSessions(userId: string) {
  return useQuery({
    queryKey: [...adminQueryKeys.user(userId), "sessions"] as const,
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUserSessions({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Revoke a specific session for a user (admin only)
 */
export function useAdminRevokeUserSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; sessionToken: string }) => {
      const { data: result, error } = await authClient.admin.revokeUserSession({
        sessionToken: data.sessionToken,
      });
      if (error) throw new Error(error.message);
      return result;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.user(variables.userId), "sessions"],
      });
    },
  });
}

/**
 * Revoke all sessions for a user (admin only)
 */
export function useAdminRevokeUserSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.revokeUserSessions({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.user(userId), "sessions"],
      });
    },
  });
}

/**
 * Remove user (admin only) - different from delete
 */
export function useAdminRemoveUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await authClient.admin.removeUser({
        userId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, userId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.user(userId) });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users });
    },
  });
}
