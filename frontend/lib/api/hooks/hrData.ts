import { useQuery } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { paths } from "../types";

// Type imports for HR data
type ContractResponse =
  paths["/hr/contracts"]["get"]["responses"]["200"]["content"]["application/json"][number];
type LeaveTypeResponse =
  paths["/hr/leave-types"]["get"]["responses"]["200"]["content"]["application/json"][number];
type LeaveRequestResponse =
  paths["/hr/leave-requests"]["get"]["responses"]["200"]["content"]["application/json"][number];
type LeaveAllocationResponse =
  paths["/hr/leave-allocations"]["get"]["responses"]["200"]["content"]["application/json"][number];
type PayslipResponse =
  paths["/hr/payslips"]["get"]["responses"]["200"]["content"]["application/json"][number];
type PayslipLineResponse =
  paths["/hr/payslips/{payslipId}/lines"]["get"]["responses"]["200"]["content"]["application/json"][number];

// ==================== Contracts ====================

export function useContracts(params?: { employeeId?: number; state?: string }) {
  return useQuery({
    queryKey: queryKeys.hr.contracts(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/contracts", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ContractResponse[];
    },
  });
}

export function useContract(contractId: number) {
  return useQuery({
    queryKey: queryKeys.hr.contract(contractId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/contracts/{contractId}", {
        params: { path: { contractId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as ContractResponse;
    },
    enabled: !!contractId,
  });
}

// ==================== Leave Types ====================

export function useLeaveTypes() {
  return useQuery({
    queryKey: queryKeys.hr.leaveTypes(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/leave-types");
      if (error) throw new Error(handleApiError(error));
      return data as LeaveTypeResponse[];
    },
  });
}

// ==================== Leave Requests ====================

export function useLeaveRequests(params?: { employeeId?: number; state?: string }) {
  return useQuery({
    queryKey: queryKeys.hr.leaveRequests(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/leave-requests", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LeaveRequestResponse[];
    },
  });
}

// ==================== Leave Allocations ====================

export function useLeaveAllocations(params?: { employeeId?: number }) {
  return useQuery({
    queryKey: queryKeys.hr.leaveAllocations(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/leave-allocations", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LeaveAllocationResponse[];
    },
  });
}

// ==================== Payslips ====================

export function usePayslips(params?: { employeeId?: number; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: queryKeys.hr.payslips(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/payslips", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as PayslipResponse[];
    },
  });
}

export function usePayslip(payslipId: number) {
  return useQuery({
    queryKey: queryKeys.hr.payslip(payslipId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/payslips/{payslipId}", {
        params: { path: { payslipId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as PayslipResponse;
    },
    enabled: !!payslipId,
  });
}

export function usePayslipLines(payslipId: number) {
  return useQuery({
    queryKey: queryKeys.hr.payslipLines(payslipId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr/payslips/{payslipId}/lines", {
        params: { path: { payslipId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as PayslipLineResponse[];
    },
    enabled: !!payslipId,
  });
}
