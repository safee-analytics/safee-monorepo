"use client";

import { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Button } from "@safee/ui";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { ProcedureRow } from "./ProcedureRow";
import { ProcedureRequirementsEditor } from "./ProcedureRequirementsEditor";

interface SectionCardProps {
  sectionIndex: number;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function SectionCard({ sectionIndex, onRemove, onMoveUp, onMoveDown }: SectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingProcedureIndex, setEditingProcedureIndex] = useState<number | null>(null);

  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<{
    structure: {
      sections: Array<{
        name: string;
        description?: string;
        sortOrder: number;
        settings?: Record<string, unknown>;
        procedures: Array<{
          referenceNumber: string;
          title: string;
          description?: string;
          sortOrder: number;
          requirements?: Record<string, unknown>;
        }>;
      }>;
    };
  }>();

  // Field array for procedures within this section
  const {
    fields: procedures,
    append,
    remove,
    move,
  } = useFieldArray({
    control,
    name: `structure.sections.${sectionIndex}.procedures`,
  });

  const sectionErrors = errors.structure?.sections?.[sectionIndex];

  const handleAddProcedure = () => {
    const nextSortOrder = procedures.length;
    append({
      referenceNumber: `${sectionIndex + 1}.${procedures.length + 1}`,
      title: `Procedure ${procedures.length + 1}`,
      description: "",
      sortOrder: nextSortOrder,
      requirements: {},
    });
  };

  const handleRemoveProcedure = (procedureIndex: number) => {
    if (procedures.length === 1) {
      return; // Must have at least one procedure
    }
    remove(procedureIndex);
  };

  const handleMoveProcedure = (from: number, to: number) => {
    move(from, to);
  };

  const handleEditProcedure = (procedureIndex: number) => {
    setEditingProcedureIndex(procedureIndex);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>

          <GripVertical className="h-4 w-4 text-gray-400" />

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section Name *</label>
              <input
                type="text"
                {...register(`structure.sections.${sectionIndex}.name`)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Initial Assessment"
              />
              {sectionErrors?.name && (
                <p className="text-xs text-red-600 mt-1">{sectionErrors.name.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <input
                type="text"
                {...register(`structure.sections.${sectionIndex}.description`)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Move section up"
              >
                <ArrowUp className="h-4 w-4 text-gray-600" />
              </button>
            )}

            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="Move section down"
              >
                <ArrowDown className="h-4 w-4 text-gray-600" />
              </button>
            )}

            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 hover:bg-red-100 rounded transition-colors"
              title="Remove section"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-4 space-y-3">
            {/* Procedures Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Procedures ({procedures.length})</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddProcedure}>
                <Plus className="h-3 w-3 mr-1.5" />
                Add Procedure
              </Button>
            </div>

            {sectionErrors?.procedures && (
              <p className="text-sm text-red-600">{sectionErrors.procedures.message as string}</p>
            )}

            {/* Procedures Table */}
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-8"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ref</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Requirements</th>
                    <th className="w-24 px-3 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {procedures.map((procedure, procedureIndex) => (
                    <ProcedureRow
                      key={procedure.id}
                      sectionIndex={sectionIndex}
                      procedureIndex={procedureIndex}
                      onRemove={() => handleRemoveProcedure(procedureIndex)}
                      onEdit={() => handleEditProcedure(procedureIndex)}
                      onMoveUp={
                        procedureIndex > 0
                          ? () => handleMoveProcedure(procedureIndex, procedureIndex - 1)
                          : undefined
                      }
                      onMoveDown={
                        procedureIndex < procedures.length - 1
                          ? () => handleMoveProcedure(procedureIndex, procedureIndex + 1)
                          : undefined
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Procedure Requirements Editor Modal */}
      {editingProcedureIndex !== null && (
        <ProcedureRequirementsEditor
          sectionIndex={sectionIndex}
          procedureIndex={editingProcedureIndex}
          onClose={() => setEditingProcedureIndex(null)}
        />
      )}
    </>
  );
}
