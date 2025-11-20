import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError, getCurrentUser, updateUserProfile, updateUserLocale } from "../client";
import { queryKeys } from "./queryKeys";
import { useOrgStore } from "@/stores/useOrgStore";

/**
 * Fetch current user profile
 */
export function useUserProfile() {
  const { setLocale } = useOrgStore();

  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const { data, error } = await getCurrentUser();
      if (error) throw new Error("Failed to fetch profile");

      // Update locale in store if it exists in profile
      if (data?.preferredLocale) {
        setLocale(data.preferredLocale);
      }

      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Parameters<typeof updateUserProfile>[0]) => {
      const { data, error } = await updateUserProfile(profile);
      if (error) throw new Error(handleApiError(error));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}

/**
 * Update user locale preference
 */
export function useUpdateUserLocale() {
  const queryClient = useQueryClient();
  const { setLocale } = useOrgStore();

  return useMutation({
    mutationFn: async (locale: "en" | "ar") => {
      const { data, error } = await updateUserLocale(locale);
      if (error) throw new Error("Failed to update locale");

      // Update locale in store
      setLocale(locale);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

// Notification Hooks
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/dashboard/notifications");
      if (error) throw new Error(handleApiError(error));
      return data || [];
    },
    retry: false,
  });
}

export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/dashboard/notifications/unread-count");
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
      const { data, error } = await apiClient.POST("/dashboard/notifications/{notificationId}/read", {
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

// Activity Hook
export function useActivity() {
  return useQuery({
    queryKey: queryKeys.activity.all,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/dashboard/activity");
      if (error) throw new Error(handleApiError(error));
      return data || [];
    },
    retry: false,
  });
}
