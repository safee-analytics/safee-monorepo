import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";

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
      if (response.error) throw response.error;
      return response.data;
    },
  });
}

// Update security settings
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SecuritySettings) => {
      const response = await apiClient.PUT("/security/settings", { body: settings });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
    },
  });
}

// Get active sessions
export function useGetActiveSessions() {
  return useQuery<Session[]>({
    queryKey: queryKeys.security.sessions,
    queryFn: async () => {
      const response = await apiClient.GET("/security/sessions", {});
      if (response.error) throw response.error;
      return response.data;
    },
  });
}

// Revoke session (security settings)
export function useSecurityRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiClient.DELETE(`/security/sessions/${sessionId}`, {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.sessions });
    },
  });
}

// Alias for backwards compatibility
export const useRevokeSession = useSecurityRevokeSession;

// Change password (security settings)
export function useSecurityChangePassword() {
  return useMutation({
    mutationFn: async (request: ChangePasswordRequest) => {
      const response = await apiClient.POST("/security/change-password", { body: request });
      return response.data;
    },
  });
}

// Alias for backwards compatibility
export const useChangePassword = useSecurityChangePassword;

// Enable two-factor authentication
export function useEnableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.POST("/security/two-factor/enable", {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
    },
  });
}

// Disable two-factor authentication
export function useDisableTwoFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.POST("/security/two-factor/disable", {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
    },
  });
}
