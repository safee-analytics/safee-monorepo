import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { GenerateReportRequest, AuditReportResponse } from "@/lib/types/reports";

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateReportRequest) => {
      const { data, error } = await apiClient.POST("/reports/generate", {
        body: request as never,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useReports(caseId?: string) {
  return useQuery({
    queryKey: ["reports", caseId],
    enabled: !!caseId,
    queryFn: async () => {
      if (!caseId) throw new Error("Case ID is required");

      const { data, error } = await apiClient.GET("/reports/case/{caseId}", {
        params: {
          path: {
            caseId,
          },
        },
      });

      if (error) throw error;
      return (data || []) as AuditReportResponse[];
    },
  });
}

export function useReport(reportId: string) {
  return useQuery({
    queryKey: ["reports", reportId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/reports/{reportId}", {
        params: {
          path: { reportId },
        },
      });

      if (error) throw error;
      return data as AuditReportResponse;
    },
    enabled: !!reportId,
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: async ({
      reportId: _reportId,
      format: _format,
    }: {
      reportId: string;
      format: "pdf" | "excel";
    }) => {
      // TODO: Implement export endpoints in backend
      throw new Error("Report export is not yet implemented");

      // When backend endpoints are ready, uncomment and fix:
      // const endpoint = format === "pdf"
      //   ? "/reports/{id}/export/pdf"
      //   : "/reports/{id}/export/excel";
      //
      // const { data, error } = await apiClient.GET(endpoint, {
      //   params: { path: { id: reportId } },
      //   parseAs: "blob",
      // });
      //
      // if (error) throw error;
      //
      // const blob = new Blob([data], {
      //   type: format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // });
      //
      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement("a");
      // link.href = url;
      // link.download = `audit-report-${reportId}.${format}`;
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(url);
      //
      // return data;
    },
  });
}

export function useReportTemplates() {
  return useQuery({
    queryKey: ["report-templates"],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/reports/templates");

      if (error) throw error;
      return data;
    },
  });
}
