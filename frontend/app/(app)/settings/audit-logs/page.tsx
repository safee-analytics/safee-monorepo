"use client";

import { useState } from "react";
import { useOrganizationAuditLogs, useExportAuditLogs, useActiveOrganization } from "@/lib/api/hooks";
import { Filter, Download, RefreshCw, Search, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export default function AuditLogsPage() {
  const { data: activeOrg } = useActiveOrganization();
  const exportAuditLogsMutation = useExportAuditLogs();

  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: auditLogs, isLoading, refetch } = useOrganizationAuditLogs(activeOrg?.id || "", filters);

  const handleFilterChange = (key: keyof AuditLogFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleExport = async (format: "csv" | "json" = "json") => {
    if (!activeOrg?.id) return;
    try {
      const result = await exportAuditLogsMutation.mutateAsync({
        orgId: activeOrg.id,
        format,
        filters,
      });

      // Create a blob and download
      const contentType = format === "csv" ? "text/csv" : "application/json";
      const blob = new Blob([result.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export audit logs:", error);
      alert("Failed to export audit logs");
    }
  };

  const filteredLogs = auditLogs?.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.entityType?.toLowerCase().includes(query) ||
      log.user?.name?.toLowerCase().includes(query) ||
      log.userAgent?.toLowerCase().includes(query)
    );
  });

  const actionTypes = [
    "created",
    "updated",
    "deleted",
    "completed",
    "failed",
    "started",
    "cancelled",
    "retrying",
  ];
  const entityTypes = ["job", "invoice", "user", "organization", "employee", "contact", "deal"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">
            View and filter all activity within {activeOrg?.name || "your organization"}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search logs by action, resource, or user..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => handleExport("json")}
                  disabled={exportAuditLogsMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {exportAuditLogsMutation.isPending ? "Exporting..." : "Export JSON"}
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  disabled={exportAuditLogsMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 border-l border-blue-500 disabled:opacity-50"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                <select
                  value={filters.action || ""}
                  onChange={(e) => handleFilterChange("action", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Actions</option>
                  {actionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                <select
                  value={filters.entityType || ""}
                  onChange={(e) => handleFilterChange("entityType", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Entities</option>
                  {entityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    onChange={(e) => handleFilterChange("startDate", e.target.value || undefined)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    onChange={(e) => handleFilterChange("endDate", e.target.value || undefined)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2">Loading audit logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.user?.name || "Unknown"}</div>
                        <div className="text-xs text-gray-500">{log.userId || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.action.includes("deleted") || log.action.includes("failed")
                              ? "bg-red-100 text-red-800"
                              : log.action.includes("created") || log.action.includes("completed")
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{log.entityType || "-"}</div>
                        <div className="text-xs text-gray-500">{log.entityId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No audit logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredLogs && filteredLogs.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(filters.offset || 0) + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(
                    (filters.offset || 0) + (filters.limit || 50),
                    (filters.offset || 0) + filteredLogs.length,
                  )}
                </span>{" "}
                results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleFilterChange("offset", Math.max(0, (filters.offset || 0) - (filters.limit || 50)))
                  }
                  disabled={!filters.offset || filters.offset === 0}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange("offset", (filters.offset || 0) + (filters.limit || 50))}
                  disabled={!filteredLogs || filteredLogs.length < (filters.limit || 50)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
