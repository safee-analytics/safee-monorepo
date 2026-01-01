"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@safee/ui";
import { useCaseSections, useCaseProcedures } from "@/lib/api/hooks";
import { CompleteProcedureModal } from "@/components/audit/scopes/CompleteProcedureModal";
import { ProcedureDetailDrawer } from "@/components/audit/scopes/ProcedureDetailDrawer";
import type { components } from "@/lib/api/types/audit";

type SectionResponse = components["schemas"]["SectionResponse"];
type ProcedureResponse = components["schemas"]["ProcedureResponse"];

export default function ScopeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const scopeId = params.scopeId as string;

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedProcedure, setSelectedProcedure] = useState<ProcedureResponse | null>(null);
  const [procedureToComplete, setProcedureToComplete] = useState<ProcedureResponse | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Fetch sections for this scope
  const { data: sections, isLoading } = useCaseSections(caseId, scopeId);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleProcedureClick = (procedure: ProcedureResponse) => {
    setSelectedProcedure(procedure);
    setIsDetailDrawerOpen(true);
  };

  const handleCompleteClick = (procedure: ProcedureResponse) => {
    setProcedureToComplete(procedure);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/audit/cases/${caseId}`)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Case
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Scope Details</h1>
        <p className="text-sm text-gray-600 mt-1">
          Review and complete procedures for this scope
        </p>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections && sections.length > 0 ? (
          sections.map((section) => (
            <SectionCard
              key={section.id}
              caseId={caseId}
              scopeId={scopeId}
              section={section}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              onProcedureClick={handleProcedureClick}
              onCompleteClick={handleCompleteClick}
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No sections found for this scope</p>
          </div>
        )}
      </div>

      {/* Complete Procedure Modal */}
      {procedureToComplete && (
        <CompleteProcedureModal
          caseId={caseId}
          scopeId={scopeId}
          sectionId={procedureToComplete.sectionId}
          procedure={procedureToComplete}
          onClose={() => setProcedureToComplete(null)}
          onSuccess={() => {
            setProcedureToComplete(null);
            // Refresh sections list
          }}
        />
      )}

      {/* Procedure Detail Drawer */}
      <ProcedureDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => {
          setIsDetailDrawerOpen(false);
          setSelectedProcedure(null);
        }}
        procedure={selectedProcedure}
        onComplete={() => {
          if (selectedProcedure) {
            setIsDetailDrawerOpen(false);
            handleCompleteClick(selectedProcedure);
          }
        }}
      />
    </div>
  );
}

// Section Card Component
interface SectionCardProps {
  caseId: string;
  scopeId: string;
  section: SectionResponse;
  isExpanded: boolean;
  onToggle: () => void;
  onProcedureClick: (procedure: ProcedureResponse) => void;
  onCompleteClick: (procedure: ProcedureResponse) => void;
}

function SectionCard({
  caseId,
  scopeId,
  section,
  isExpanded,
  onToggle,
  onProcedureClick,
  onCompleteClick,
}: SectionCardProps) {
  const { data: procedures } = useCaseProcedures(caseId, scopeId, section.id);

  // Calculate counts from fetched procedures
  const totalCount = procedures?.length || 0;
  const completedCount = procedures?.filter((p) => p.isCompleted).length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{section.name}</h3>
            {section.description && (
              <p className="text-sm text-gray-600 mt-0.5">{section.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {completedCount}/{totalCount} completed
            </div>
            <div className="text-xs text-gray-500">{progress}% complete</div>
          </div>
          <div className="w-24">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  progress === 100
                    ? "bg-green-600"
                    : progress > 50
                      ? "bg-blue-600"
                      : "bg-blue-400"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </button>

      {/* Procedures Table */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-20">
                  Step
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                  Procedure
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-32">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {procedures && procedures.length > 0 ? (
                procedures.map((procedure) => (
                  <tr
                    key={procedure.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onProcedureClick(procedure)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {procedure.referenceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{procedure.title}</p>
                        {procedure.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{procedure.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {procedure.isCompleted ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!procedure.isCompleted && procedure.canEdit && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCompleteClick(procedure);
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No procedures in this section
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
