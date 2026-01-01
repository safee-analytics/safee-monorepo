import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";

export type ActivityType =
  | "case_created"
  | "status_changed"
  | "priority_updated"
  | "document_uploaded"
  | "document_approved"
  | "document_rejected"
  | "comment_added"
  | "team_member_assigned"
  | "team_member_removed"
  | "case_completed"
  | "case_archived"
  | "scope_created"
  | "procedure_completed"
  | "plan_created"
  | "report_generated";

export interface CaseActivityResponse {
  id: string;
  caseId: string;
  activityType: ActivityType;
  userId?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  metadata?: {
    caseName?: string;
    oldValue?: string;
    newValue?: string;
    documentName?: string;
    documentId?: string;
    userName?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    commentId?: string;
    scopeId?: string;
    planId?: string;
    reportId?: string;
    [key: string]: unknown;
  } | null;
  isRead?: Record<string, boolean> | null;
  createdAt: string | Date;
}

export interface CreateCaseActivityRequest {
  caseId: string;
  activityType: ActivityType;
  metadata?: {
    caseName?: string;
    oldValue?: string;
    newValue?: string;
    documentName?: string;
    documentId?: string;
    userName?: string;
    assignedUserId?: string;
    assignedUserName?: string;
    commentId?: string;
    scopeId?: string;
    planId?: string;
    reportId?: string;
    [key: string]: unknown;
  };
}

export interface PresenceResponse {
  id: string;
  caseId: string;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
  lastSeenAt: string | Date;
}

export interface UpdatePresenceRequest {
  caseId: string;
}




export function useCaseActivities(caseId: string, options?: { limit?: number; refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.collaboration.activities(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/collaboration/activities/case/{caseId}", {
        params: {
          path: { caseId },
          query: { limit: options?.limit },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as CaseActivityResponse[];
    },
    enabled: !!caseId,
    refetchInterval: options?.refetchInterval || false, 
  });
}


export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCaseActivityRequest) => {
      const { data, error } = await apiClient.POST("/collaboration/activities", {
        body: request,
      });
      if (error) throw new Error(handleApiError(error));
      return data as CaseActivityResponse;
    },
    onSuccess: (_, variables) => {
      
      void queryClient.invalidateQueries({ queryKey: queryKeys.collaboration.activities(variables.caseId) });
    },
  });
}


export function useMarkActivitiesAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityIds: string[]) => {
      const { data, error } = await apiClient.POST("/collaboration/activities/mark-read", {
        body: { activityIds },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: () => {
      
      void queryClient.invalidateQueries({ queryKey: ["collaboration", "activities"] });
    },
  });
}


export function useUpdatePresence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdatePresenceRequest) => {
      const { data, error } = await apiClient.POST("/collaboration/presence", {
        body: request,
      });
      if (error) throw new Error(handleApiError(error));
      return data as PresenceResponse;
    },
    onSuccess: (_, variables) => {
      
      void queryClient.invalidateQueries({ queryKey: queryKeys.collaboration.presence(variables.caseId) });
    },
  });
}


export function useActiveViewers(caseId: string, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: queryKeys.collaboration.presence(caseId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/collaboration/presence/case/{caseId}", {
        params: {
          path: { caseId },
        },
      });
      if (error) throw new Error(handleApiError(error));
      return data as PresenceResponse[];
    },
    enabled: !!caseId,
    refetchInterval: options?.refetchInterval || false, 
  });
}


export function usePresenceTracking(caseId: string, enabled = true) {
  const updatePresence = useUpdatePresence();

  useQuery({
    queryKey: ["presence-tracking", caseId],
    queryFn: async () => {
      if (enabled && caseId) {
        await updatePresence.mutateAsync({ caseId });
      }
      return null;
    },
    enabled: enabled && !!caseId,
    refetchInterval: 30000, 
    refetchIntervalInBackground: true,
  });
}
