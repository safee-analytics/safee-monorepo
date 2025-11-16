import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import type { paths } from "../types";
import { queryKeys } from "./queryKeys";

// User Profile Hooks
export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/users/me");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      profile: paths["/users/me"]["patch"]["requestBody"]["content"]["application/json"],
    ) => {
      const { data, error } = await apiClient.PATCH("/users/me", {
        body: profile,
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}

// Notification Hooks
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/dashboard/notifications");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/v1/dashboard/notifications/unread-count");
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { data, error } = await apiClient.POST("/api/v1/dashboard/notifications/{notificationId}/read", {
        params: {
          path: { notificationId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}
