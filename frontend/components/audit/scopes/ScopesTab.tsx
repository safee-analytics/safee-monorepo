"use client";

import { useState } from "react";
import { Button } from "@safee/ui";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { components } from "@/lib/api/types/audit";
import { ScopeCard } from "./ScopeCard";
import { AddScopeFromTemplateModal } from "./AddScopeFromTemplateModal";

type ScopeResponse = components["schemas"]["ScopeResponse"];

interface ScopesTabProps {
  caseId: string;
  scopes: ScopeResponse[];
}

export function ScopesTab({ caseId, scopes }: ScopesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  const handleScopeClick = (scopeId: string) => {
    router.push(`/audit/cases/${caseId}/scopes/${scopeId}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Case Scopes</h2>
          <p className="text-sm text-gray-600 mt-1">Manage scope instances for this audit case</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add from Template
        </Button>
      </div>

      {/* Scopes List */}
      {scopes.length > 0 ? (
        <div className="space-y-3">
          {scopes.map((scope) => (
            <ScopeCard key={scope.id} scope={scope} onClick={() => handleScopeClick(scope.id)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Scopes Yet</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Create your first scope from a template to begin tracking procedures and progress for this case.
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Scope from Template
          </Button>
        </div>
      )}

      {/* Add Scope Modal */}
      {showAddModal && (
        <AddScopeFromTemplateModal
          caseId={caseId}
          onClose={() => setShowAddModal(false)}
          onSuccess={(scopeId) => {
            setShowAddModal(false);
            router.push(`/audit/cases/${caseId}/scopes/${scopeId}`);
          }}
        />
      )}
    </div>
  );
}
