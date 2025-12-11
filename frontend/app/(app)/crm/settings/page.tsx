"use client";

import { useState } from "react";
import { ArrowLeft, Settings, Users, Target, XCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStages, useLostReasons, useCrmTeams, useSyncCRM } from "@/lib/api/hooks";
import { AnimatedButton } from "@safee/ui";

export default function CRMSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"stages" | "lost-reasons" | "teams">("stages");

  const { data: stages, isLoading: stagesLoading } = useStages();
  const { data: lostReasons, isLoading: lostReasonsLoading } = useLostReasons();
  const { data: teams, isLoading: teamsLoading } = useCrmTeams();
  const syncMutation = useSyncCRM();

  const handleSync = async (_type: "stages" | "lost-reasons" | "teams") => {
    try {
      await syncMutation.mutateAsync("all");
    } catch (err) {
      console.error(`Failed to sync ${_type}:`, err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200">
        <div className="whitespace-nowrap py-4">
          <button
            onClick={() => { router.back(); }}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to CRM</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Settings className="h-7 w-7" />
                <span>CRM Settings</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Configure stages, lost reasons, and sales teams</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto whitespace-nowrap py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setActiveTab("stages"); }}
              className={`flex items-center space-x-2 whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "stages"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Target className="h-4 w-4" />
              <span>Sales Stages</span>
              {stages && <span className="text-xs text-gray-500">({stages.length})</span>}
            </button>
            <button
              onClick={() => { setActiveTab("lost-reasons"); }}
              className={`flex items-center space-x-2 whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "lost-reasons"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <XCircle className="h-4 w-4" />
              <span>Lost Reasons</span>
              {lostReasons && <span className="text-xs text-gray-500">({lostReasons.length})</span>}
            </button>
            <button
              onClick={() => { setActiveTab("teams"); }}
              className={`flex items-center space-x-2 whitespace-nowrap py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "teams"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Sales Teams</span>
              {teams && <span className="text-xs text-gray-500">({teams.length})</span>}
            </button>
          </div>
        </div>

        {/* Stages Tab */}
        {activeTab === "stages" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sales Stages</h2>
                <p className="text-sm text-gray-600 mt-1">Pipeline stages for tracking lead progress</p>
              </div>
              <AnimatedButton
                onClick={() => handleSync("stages")}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </AnimatedButton>
            </div>

            {stagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : stages && stages.length > 0 ? (
              <div className="space-y-3">
                {stages
                  .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                          {stage.sequence}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{stage.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            {stage.isWon && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                Won Stage
                              </span>
                            )}
                            {stage.fold && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                Folded in Kanban
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              Team: {stage.teamIds?.length ? "Specific Teams" : "All Teams"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {stage.requirements && (
                          <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
                            Has requirements
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No stages configured</p>
                <p className="text-sm text-gray-400">Click Refresh to load stages</p>
              </div>
            )}
          </div>
        )}

        {/* Lost Reasons Tab */}
        {activeTab === "lost-reasons" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Lost Reasons</h2>
                <p className="text-sm text-gray-600 mt-1">Reasons for marking leads as lost</p>
              </div>
              <AnimatedButton
                onClick={() => handleSync("lost-reasons")}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </AnimatedButton>
            </div>

            {lostReasonsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : lostReasons && lostReasons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lostReasons.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-gray-900">{reason.name}</span>
                    </div>
                    {reason.active === false && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No lost reasons configured</p>
                <p className="text-sm text-gray-400">Click Refresh to load lost reasons</p>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sales Teams</h2>
                <p className="text-sm text-gray-600 mt-1">Organize your sales force into teams</p>
              </div>
              <AnimatedButton
                onClick={() => handleSync("teams")}
                variant="outline"
                size="md"
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </AnimatedButton>
            </div>

            {teamsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : teams && teams.length > 0 ? (
              <div className="space-y-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                        {team.active !== undefined && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                team.active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {team.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        )}
                      </div>
                      {team.active === false && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded">Inactive</span>
                      )}
                    </div>

                    {/* Team Members */}
                    {team.memberIds && team.memberIds.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {team.memberIds.map((memberId: number) => (
                            <div
                              key={memberId}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-full"
                            >
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                                U
                              </div>
                              <span className="text-sm text-gray-900">User {memberId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No teams configured</p>
                <p className="text-sm text-gray-400">Click Refresh to load sales teams</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
