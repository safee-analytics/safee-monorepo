import { useQuery } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";

export interface DashboardStatsResponse {
  activeCases: number;
  pendingReviews: number;
  completedAudits: number;
  totalCases: number;
  completionRate: number;
}

export interface RecentCaseUpdateResponse {
  id: string;
  type: "case_update";
  caseId: string;
  caseNumber: string;
  clientName: string;
  status: string;
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

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
