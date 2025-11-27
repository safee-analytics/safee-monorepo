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
      if (!response.data) throw new Error("Failed to fetch security settings");
      return response.data;
    },
  });
}

// Update security settings (not yet implemented in backend)
export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SecuritySettings) => {
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
