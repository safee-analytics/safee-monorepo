import { useQuery } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { components } from "@/lib/api/types/dashboard";

// Use gateway types directly
export type DashboardStatsResponse = components["schemas"]["DashboardStatsResponse"];
export type RecentCaseUpdateResponse = components["schemas"]["RecentCaseUpdateResponse"];
export type NotificationResponse = components["schemas"]["NotificationResponse"];
export type UnreadNotificationsCountResponse = components["schemas"]["UnreadNotificationsCountResponse"];

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/dashboard/stats");
      if (error) throw new Error(handleApiError(error));
      return data as DashboardStatsResponse;
    },
  });
}

export function useDashboardActivity(limit?: number) {
  return useQuery({
    queryKey: queryKeys.dashboard.activity(limit),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/dashboard/activity", {
        params: {
          query: { limit },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as RecentCaseUpdateResponse[];
    },
  });
}
