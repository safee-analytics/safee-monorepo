import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "./queryKeys";
import { useChangePassword, useListSessions, useRevokeSession, useSession } from "./auth";
import { z } from "zod";
import {
  securitySettingsSchema,
  sessionSchema,
  changePasswordRequestSchema,
} from "@/lib/validation/schemas/settings.schema";

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export function useGetSecuritySettings() {
  return useQuery<SecuritySettings>({
    queryKey: queryKeys.security.settings,
    queryFn: async () => {
      const response = await apiClient.GET("/security/settings", {});
      if (!response.data) throw new Error("Failed to fetch security settings");
      return securitySettingsSchema.parse(response.data);
    },
  });
}

export function useUpdateSecuritySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_settings: SecuritySettings) => {
      // TODO: [Backend] - Implement PUT /security/settings endpoint
      //   Details: The backend needs an API endpoint to handle updates to security settings. Once implemented, update this hook to call the new endpoint.
      //   Priority: High
      throw new Error("Not yet implemented");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.security.settings });
    },
  });
}

export { useChangePassword, useRevokeSession };

export function useGetActiveSessions() {
  const { data: sessions, isLoading } = useListSessions();
  const { data: currentSession } = useSession();

  const mappedSessions = useMemo(() => {
    if (!sessions) return [];
    // sessions is already an array of session objects
    const sessionArray = Array.isArray(sessions) ? sessions : [];
    return sessionArray.map(
      (s: { id: string; userAgent?: string | null; ipAddress?: string | null; updatedAt: Date }) => {
        const userAgent = s.userAgent || "Unknown device";
        const ipAddress = s.ipAddress || "Unknown location";
        return {
          id: s.id,
          device: userAgent,
          location: ipAddress,
          lastActive: new Date(s.updatedAt).toLocaleString(),
          current: s.id === currentSession?.session?.id,
        };
      },
    );
  }, [sessions, currentSession]);

  return { data: mappedSessions, isLoading };
}
