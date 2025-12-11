import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { paths } from "../types";

type LeadResponse = paths["/crm/leads"]["get"]["responses"]["200"]["content"]["application/json"][number];
type CreateLeadRequest = paths["/crm/leads"]["post"]["requestBody"]["content"]["application/json"];
type UpdateLeadRequest = paths["/crm/leads/{leadId}"]["put"]["requestBody"]["content"]["application/json"];

type StageResponse = paths["/crm/stages"]["get"]["responses"]["200"]["content"]["application/json"][number];

type ContactResponse =
  paths["/crm/contacts"]["get"]["responses"]["200"]["content"]["application/json"][number];
type CreateContactRequest = paths["/crm/contacts"]["post"]["requestBody"]["content"]["application/json"];
type UpdateContactRequest =
  paths["/crm/contacts/{contactId}"]["put"]["requestBody"]["content"]["application/json"];

type ActivityResponse =
  paths["/crm/activities"]["get"]["responses"]["200"]["content"]["application/json"][number];
type CreateActivityRequest = paths["/crm/activities"]["post"]["requestBody"]["content"]["application/json"];

type TeamResponse = paths["/crm/teams"]["get"]["responses"]["200"]["content"]["application/json"][number];

type LostReasonResponse =
  paths["/crm/lost-reasons"]["get"]["responses"]["200"]["content"]["application/json"][number];

export function useLeads(params?: {
  type?: "lead" | "opportunity";
  stageId?: number;
  teamId?: number;
  userId?: number;
  partnerId?: number;
  active?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.crm.leads(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/leads", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LeadResponse[];
    },
  });
}

export function useLead(leadId: number) {
  return useQuery({
    queryKey: queryKeys.crm.lead(leadId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/leads/{leadId}", {
        params: { path: { leadId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LeadResponse;
    },
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: CreateLeadRequest) => {
      const { data, error } = await apiClient.POST("/crm/leads", {
        body: lead,
      });
      if (error) throw new Error(handleApiError(error));
      return data as { id: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, data: leadData }: { leadId: number; data: UpdateLeadRequest }) => {
      const { data, error } = await apiClient.PUT("/crm/leads/{leadId}", {
        params: { path: { leadId } },
        body: leadData,
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(variables.leadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, partnerId }: { leadId: number; partnerId?: number }) => {
      const { data, error } = await apiClient.POST("/crm/leads/{leadId}/convert", {
        params: { path: { leadId } },
        body: { partnerId },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(variables.leadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
    },
  });
}

export function useWinLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: number) => {
      const { data, error } = await apiClient.POST("/crm/leads/{leadId}/win", {
        params: { path: { leadId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, leadId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(leadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
    },
  });
}

export function useLoseLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, lostReasonId }: { leadId: number; lostReasonId?: number }) => {
      const { data, error } = await apiClient.POST("/crm/leads/{leadId}/lose", {
        params: { path: { leadId } },
        body: { lostReasonId },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lead(variables.leadId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
    },
  });
}

export function useStages(params?: { teamId?: number; isWon?: boolean }) {
  return useQuery({
    queryKey: queryKeys.crm.stages(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/stages", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as StageResponse[];
    },
  });
}

export function useStage(stageId: number) {
  return useQuery({
    queryKey: queryKeys.crm.stage(stageId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/stages/{stageId}", {
        params: { path: { stageId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as StageResponse;
    },
    enabled: !!stageId,
  });
}

export function useContacts(params?: { isCustomer?: boolean; isSupplier?: boolean; isCompany?: boolean }) {
  return useQuery({
    queryKey: queryKeys.crm.contacts(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/contacts", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ContactResponse[];
    },
  });
}

export function useContact(contactId: number) {
  return useQuery({
    queryKey: queryKeys.crm.contact(contactId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/contacts/{contactId}", {
        params: { path: { contactId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ContactResponse;
    },
    enabled: !!contactId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: CreateContactRequest) => {
      const { data, error } = await apiClient.POST("/crm/contacts", {
        body: contact,
      });
      if (error) throw new Error(handleApiError(error));
      return data as { id: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.contacts() });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      data: contactData,
    }: {
      contactId: number;
      data: UpdateContactRequest;
    }) => {
      const { data, error } = await apiClient.PUT("/crm/contacts/{contactId}", {
        params: { path: { contactId } },
        body: contactData,
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.contact(variables.contactId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.contacts() });
    },
  });
}

export function useCrmActivities(params?: { leadId?: number; userId?: number; state?: string }) {
  return useQuery({
    queryKey: queryKeys.crm.activities(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/activities", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ActivityResponse[];
    },
  });
}

export function useCrmActivity(activityId: number) {
  return useQuery({
    queryKey: queryKeys.crm.activity(activityId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/activities/{activityId}", {
        params: { path: { activityId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ActivityResponse;
    },
    enabled: !!activityId,
  });
}

export function useCreateCrmActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activity: CreateActivityRequest) => {
      const { data, error } = await apiClient.POST("/crm/activities", {
        body: activity,
      });
      if (error) throw new Error(handleApiError(error));
      return data as { id: number };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.activities() });
    },
  });
}

export function useMarkCrmActivityDone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: number) => {
      const { data, error } = await apiClient.POST("/crm/activities/{activityId}/done", {
        params: { path: { activityId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (data, activityId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.activity(activityId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.activities() });
    },
  });
}

export function useCrmTeams(params?: { active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.crm.teams(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/teams", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as TeamResponse[];
    },
  });
}

export function useCrmTeam(teamId: number) {
  return useQuery({
    queryKey: queryKeys.crm.team(teamId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/teams/{teamId}", {
        params: { path: { teamId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as TeamResponse;
    },
    enabled: !!teamId,
  });
}

export function useLostReasons(params?: { active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.crm.lostReasons(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/lost-reasons", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LostReasonResponse[];
    },
  });
}

export function useLostReason(reasonId: number) {
  return useQuery({
    queryKey: queryKeys.crm.lostReason(reasonId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/crm/lost-reasons/{reasonId}", {
        params: { path: { reasonId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LostReasonResponse;
    },
    enabled: !!reasonId,
  });
}

export function useSyncCRM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entity?: "leads" | "contacts" | "all") => {
      const { data, error } = await apiClient.POST("/crm/sync", {
        body: { entity },
      });
      if (error) throw new Error(handleApiError(error));
      return data as {
        success: boolean;
        leadsSync?: number;
        contactsSync?: number;
        stagesSync?: number;
        teamsSync?: number;
        lostReasonsSync?: number;
        errors?: string[];
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.leads() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.contacts() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.stages() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.teams() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.crm.lostReasons() });
    },
  });
}
