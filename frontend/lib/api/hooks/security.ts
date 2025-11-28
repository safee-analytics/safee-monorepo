import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";
import {
  useChangePassword,
  useListSessions,
  useRevokeSession,
  useSession,
} from "./auth";

// Types
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  requirePasswordChange: boolean;
  allowMultipleSessions: boolean;
  ipWhitelisting: boolean;
  loginNotifications: boolean;
}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Get security settings
export function useGetSecuritySettings() {
  return useQuery<SecuritySettings>({
    queryKey: queryKeys.security.settings,
    queryFn: async () => {
      const response = await apiClient.GET("/security/settings", {});
      if (!response.data) throw new Error("Failed to fetch security settings");
      return response.data;
    },
  });
}

// Update security settings (not yet implemented in backend)
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_settings: SecuritySettings) => {
      // TODO: Implement PUT /security/settings in backend
      throw new Error("Not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
    },
  });
}

// Note: Session management, password change, and 2FA hooks are provided by better-auth
// Import from './auth' instead:
// - useListSessions (or create useGetActiveSessions alias)
// - useRevokeSession
// - useChangePassword
// - useTwoFactor
export { useChangePassword, useRevokeSession };

export function useGetActiveSessions() {
  const { data: sessions, isLoading } = useListSessions();
  const { data: currentSession } = useSession();

  const mappedSessions = useMemo(() => {
    if (!sessions) return [];
    // sessions is already an array of session objects
    const sessionArray = Array.isArray(sessions) ? sessions : [];
    return sessionArray.map((s: { id: string; userAgent?: string | null; ipAddress?: string | null; updatedAt: Date }) => {
      const userAgent = s.userAgent || "Unknown device";
      const ipAddress = s.ipAddress || "Unknown location";
      return {
        id: s.id,
        device: userAgent,
        location: ipAddress,
        lastActive: new Date(s.updatedAt).toLocaleString(),
        current: s.id === currentSession?.session?.id,
      };
    });
  }, [sessions, currentSession]);

  return { data: mappedSessions, isLoading };
}