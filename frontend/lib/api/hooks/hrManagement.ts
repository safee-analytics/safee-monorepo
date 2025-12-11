import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, handleApiError } from "../client";
import { queryKeys } from "./queryKeys";
import type { paths } from "../types";

// Type imports for HR Management
type EmployeeDbResponse =
  paths["/hr-management/employees"]["get"]["responses"]["200"]["content"]["application/json"][number];
type CreateEmployeeRequest =
  paths["/hr-management/employees"]["post"]["requestBody"]["content"]["application/json"];
type UpdateEmployeeRequest =
  paths["/hr-management/employees/{employeeId}"]["put"]["requestBody"]["content"]["application/json"];
type DepartmentDbResponse =
  paths["/hr-management/departments"]["get"]["responses"]["200"]["content"]["application/json"][number];
type CreateDepartmentRequest =
  paths["/hr-management/departments"]["post"]["requestBody"]["content"]["application/json"];
type UpdateDepartmentRequest =
  paths["/hr-management/departments/{departmentId}"]["put"]["requestBody"]["content"]["application/json"];
export type LeaveBalanceResponse =
  paths["/hr-management/employees/{employeeId}/leave-balances"]["get"]["responses"]["200"]["content"]["application/json"][number];

// ==================== Employees ====================

export function useEmployees(params?: { departmentId?: string; managerId?: string }) {
  return useQuery({
    queryKey: queryKeys.hr.employees(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr-management/employees", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as EmployeeDbResponse[];
    },
  });
}

export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.hr.employee(employeeId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr-management/employees/{employeeId}", {
        params: { path: { employeeId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as EmployeeDbResponse;
    },
    enabled: !!employeeId,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: CreateEmployeeRequest) => {
      const { data, error } = await apiClient.POST("/hr-management/employees", {
        body: employee,
      });
      if (error) throw new Error(handleApiError(error));
      return data as EmployeeDbResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      data: employeeData,
    }: {
      employeeId: string;
      data: UpdateEmployeeRequest;
    }) => {
      const { data, error } = await apiClient.PUT("/hr-management/employees/{employeeId}", {
        params: { path: { employeeId } },
        body: employeeData,
      });
      if (error) throw new Error(handleApiError(error));
      return data as EmployeeDbResponse;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.employee(variables.employeeId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { data, error } = await apiClient.DELETE("/hr-management/employees/{employeeId}", {
        params: { path: { employeeId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (_, employeeId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.employee(employeeId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.employees() });
    },
  });
}

// ==================== Departments ====================

export function useDepartments(params?: { parentId?: string }) {
  return useQuery({
    queryKey: queryKeys.hr.departments(params),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr-management/departments", {
        params: { query: params },
      });
      if (error) throw new Error(handleApiError(error));
      return data as DepartmentDbResponse[];
    },
  });
}

export function useDepartment(departmentId: string) {
  return useQuery({
    queryKey: queryKeys.hr.department(departmentId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr-management/departments/{departmentId}", {
        params: { path: { departmentId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as DepartmentDbResponse;
    },
    enabled: !!departmentId,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (department: CreateDepartmentRequest) => {
      const { data, error } = await apiClient.POST("/hr-management/departments", {
        body: department,
      });
      if (error) throw new Error(handleApiError(error));
      return data as DepartmentDbResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.departments() });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      departmentId,
      data: departmentData,
    }: {
      departmentId: string;
      data: UpdateDepartmentRequest;
    }) => {
      const { data, error } = await apiClient.PUT("/hr-management/departments/{departmentId}", {
        params: { path: { departmentId } },
        body: departmentData,
      });
      if (error) throw new Error(handleApiError(error));
      return data as DepartmentDbResponse;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.department(variables.departmentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.departments() });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentId: string) => {
      const { data, error } = await apiClient.DELETE("/hr-management/departments/{departmentId}", {
        params: { path: { departmentId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as { success: boolean };
    },
    onSuccess: (_, departmentId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.department(departmentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.hr.departments() });
    },
  });
}

// ==================== Leave Balances ====================

export function useLeaveBalances(employeeId: string) {
  return useQuery({
    queryKey: queryKeys.hr.leaveBalances(employeeId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/hr-management/employees/{employeeId}/leave-balances", {
        params: { path: { employeeId } },
      });
      if (error) throw new Error(handleApiError(error));
      return data as LeaveBalanceResponse[];
    },
    enabled: !!employeeId,
  });
}

export function useLeaveBalance(employeeId: string, leaveTypeId: string) {
  return useQuery({
    queryKey: queryKeys.hr.leaveBalance(employeeId, leaveTypeId),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/hr-management/employees/{employeeId}/leave-balances/{leaveTypeId}",
        {
          params: { path: { employeeId, leaveTypeId } },
        },
      );
      if (error) throw new Error(handleApiError(error));
      return data as LeaveBalanceResponse;
    },
    enabled: !!employeeId && !!leaveTypeId,
  });
}
