"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Filter, Download, RefreshCw } from "lucide-react";
import { ViewToggle } from "@/components/crm/shared/ViewToggle";
import { LeadKanbanBoard } from "@/components/crm/leads/LeadKanbanBoard";
import { LeadTableView } from "@/components/crm/leads/LeadTableView";
import { useLeads, useStages, useSyncCRM } from "@/lib/api/hooks";
import { useCrmStore } from "@/stores/useCrmStore";
import { AnimatedButton } from "@safee/ui";

export default function LeadsPage() {
  const { leadsViewMode, setLeadsViewMode, leadFilters, setLeadFilters } = useCrmStore();
  const [showFilters, setShowFilters] = useState(false);

  const { data: leads, isLoading: leadsLoading } = useLeads(leadFilters);
  const { data: stages, isLoading: stagesLoading } = useStages();
  const syncMutation = useSyncCRM();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync("leads");
    } catch (error) {
      console.error("Failed to sync leads:", error);
    }
  };

  const handleTypeFilter = (type: "lead" | "opportunity" | undefined) => {
    setLeadFilters({ ...leadFilters, type });
  };

  const isLoading = leadsLoading || stagesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads & Opportunities</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your sales pipeline and track opportunities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AnimatedButton
                onClick={handleSync}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw
                  className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </AnimatedButton>
              <Link href="/crm/leads/new">
                <AnimatedButton variant="primary" size="md" className="flex items-center space-x-2 whitespace-nowrap">
                  <Plus className="h-4 w-4" />
                  <span>New Lead</span>
                </AnimatedButton>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ViewToggle view={leadsViewMode} onViewChange={setLeadsViewMode} />

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleTypeFilter(undefined)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !leadFilters.type
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleTypeFilter("lead")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    leadFilters.type === "lead"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Leads
                </button>
                <button
                  onClick={() => handleTypeFilter("opportunity")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    leadFilters.type === "opportunity"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Opportunities
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={leadFilters.stageId || ""}
                    onChange={(e) =>
                      setLeadFilters({
                        ...leadFilters,
                        stageId: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Stages</option>
                    {stages?.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={leadFilters.active === undefined ? "" : leadFilters.active.toString()}
                    onChange={(e) =>
                      setLeadFilters({
                        ...leadFilters,
                        active: e.target.value === "" ? undefined : e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-end">
                  <button
                    onClick={() => setLeadFilters({})}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : leadsViewMode === "kanban" ? (
          stages && leads ? (
            <LeadKanbanBoard leads={leads} stages={stages} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No data available</p>
            </div>
          )
        ) : (
          <div className="px-6">
            {leads ? (
              <LeadTableView leads={leads} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
