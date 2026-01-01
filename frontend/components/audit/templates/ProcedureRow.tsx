"use client";

import { useFormContext } from "react-hook-form";
import { GripVertical, ArrowUp, ArrowDown, Trash2, Edit } from "lucide-react";

interface ProcedureRowProps {
  sectionIndex: number;
  procedureIndex: number;
  onRemove: () => void;
  onEdit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ProcedureRow({
  sectionIndex,
  procedureIndex,
  onRemove,
  onEdit,
  onMoveUp,
  onMoveDown,
}: ProcedureRowProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<{
    structure: {
      sections: Array<{
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

  const basePath = `structure.sections.${sectionIndex}.procedures.${procedureIndex}` as const;
  const procedureErrors = errors.structure?.sections?.[sectionIndex]?.procedures?.[procedureIndex];

  const requirements = watch(`${basePath}.requirements`);
  const requirementCount = requirements ? Object.keys(requirements).length : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-2 py-2">
        <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          {...register(`${basePath}.referenceNumber`)}
          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1.1"
        />
        {procedureErrors?.referenceNumber && (
          <p className="text-xs text-red-600 mt-1">{procedureErrors.referenceNumber.message as string}</p>
        )}
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          {...register(`${basePath}.title`)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Procedure title"
        />
        {procedureErrors?.title && (
          <p className="text-xs text-red-600 mt-1">{procedureErrors.title.message as string}</p>
        )}
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          {...register(`${basePath}.description`)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional description"
        />
      </td>

      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {requirementCount > 0 ? `${requirementCount} fields` : "Configure"}
        </button>
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-1">
          {onMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Move up"
            >
              <ArrowUp className="h-3 w-3 text-gray-600" />
            </button>
          )}

          {onMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Move down"
            >
              <ArrowDown className="h-3 w-3 text-gray-600" />
            </button>
          )}

          <button
            type="button"
            onClick={onEdit}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Edit requirements"
          >
            <Edit className="h-3 w-3 text-blue-600" />
          </button>

          <button
            type="button"
            onClick={onRemove}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Remove procedure"
          >
            <Trash2 className="h-3 w-3 text-red-600" />
          </button>
        </div>
      </td>
    </tr>
  );
}
