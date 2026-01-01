import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError, getCurrentUser, updateUserProfile, updateUserLocale } from "../client";
import { queryKeys } from "./queryKeys";
import { useOrgStore } from "@/stores/useOrgStore";


import { userSchema } from "@/lib/validation";
// ... (rest of the imports)
export function useUserProfile() {
  const { setLocale } = useOrgStore();

  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const { data, error } = await getCurrentUser();
      if (error) throw new Error("Failed to fetch profile");

      const validation = userSchema.safeParse(data);
      if (!validation.success) {
        console.error("User profile validation error:", validation.error);
        return null;
      }

      if (validation.data?.preferredLocale) {
        setLocale(validation.data.preferredLocale);
      }

      return validation.data;
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    },
  });
}


export function useUpdateUserLocale() {
  const queryClient = useQueryClient();
  const { setLocale } = useOrgStore();

  return useMutation({
    mutationFn: async (locale: "en" | "ar") => {
      const { data, error } = await updateUserLocale(locale);
      if (error) throw new Error("Failed to update locale");

      
      setLocale(locale);

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      void queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}


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
    refetchInterval: 30000, 
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}


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
