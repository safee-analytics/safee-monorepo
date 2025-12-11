"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Paperclip,
  MessageSquare,
  FileText,
  Eye,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { ICVSection, ICVProcedure } from "@/types/icv";
import { CollapsibleChevron } from "@/components/ui/DirectionalChevron";

interface ICVScopeEditorProps {
  sections: ICVSection[];
  onSectionsChange: (sections: ICVSection[]) => void;
  readOnly?: boolean;
}

export function ICVScopeEditor({ sections, onSectionsChange, readOnly = false }: ICVScopeEditorProps) {
  const { t, locale } = useTranslation();
  const [editingProcedure, setEditingProcedure] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const isRTL = locale === "ar";

  const toggleSection = (sectionId: string) => {
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId ? { ...section, isCollapsed: !section.isCollapsed } : section,
      ),
    );
  };

  const toggleProcedureComplete = (sectionId: string, procedureId: string) => {
    onSectionsChange(
      sections.map((section) => {
        if (section.id === sectionId) {
          const updatedProcedures = section.procedures.map((proc) =>
            proc.id === procedureId ? { ...proc, isCompleted: !proc.isCompleted } : proc,
          );
          const allComplete = updatedProcedures.every((p) => p.isCompleted);
          return { ...section, procedures: updatedProcedures, isCompleted: allComplete };
        }
        return section;
      }),
    );
  };

  const addProcedure = (sectionId: string) => {
    const newProcedure: ICVProcedure = {
      id: `proc-${Date.now()}`,
      step: "",
      description: t.audit.newProcedure,
      isRequired: false,
      isCompleted: false,
      attachments: [],
      observations: [],
      reviewComments: [],
      canEdit: true,
    };

    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, procedures: [...section.procedures, newProcedure] }
          : section,
      ),
    );
  };

  const removeProcedure = (sectionId: string, procedureId: string) => {
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, procedures: section.procedures.filter((p) => p.id !== procedureId) }
          : section,
      ),
    );
  };

  const startEditProcedure = (procedure: ICVProcedure) => {
    setEditingProcedure(procedure.id);
    setEditText(procedure.description);
  };

  const saveProcedureEdit = (sectionId: string, procedureId: string) => {
    onSectionsChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              procedures: section.procedures.map((proc) =>
                proc.id === procedureId ? { ...proc, description: editText } : proc,
              ),
            }
          : section,
      ),
    );
    setEditingProcedure(null);
  };

  const cancelEdit = () => {
    setEditingProcedure(null);
    setEditText("");
  };

  return (
    <div className="space-y-3">
      {sections.map((section, sectionIndex) => (
        <motion.div
          key={section.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.05 }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {/* Section Header */}
          <button
            onClick={() => { toggleSection(section.id); }}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {section.isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400" />
              )}
              <h3 className="font-semibold text-gray-900">{section.name}</h3>
              <span className="text-xs text-gray-500">
                ({section.procedures.filter((p) => p.isCompleted).length}/{section.procedures.length})
              </span>
            </div>
            <CollapsibleChevron isExpanded={!section.isCollapsed} className="w-5 h-5 text-gray-500" />
          </button>

          {/* Section Content */}
          <AnimatePresence>
            {!section.isCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200"
              >
                {section.procedures.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            {t.audit.step}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                            {t.audit.procedure}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            {t.audit.resultReport}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            {t.audit.status}
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                            {t.audit.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {section.procedures.map((procedure) => (
                          <tr key={procedure.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{procedure.step}</td>
                            <td className="px-4 py-3">
                              {editingProcedure === procedure.id && !readOnly ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => { setEditText(e.target.value); }}
                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={() => { saveProcedureEdit(section.id, procedure.id); }}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-900">{procedure.description}</span>
                                  {procedure.canEdit && !readOnly && (
                                    <button
                                      onClick={() => { startEditProcedure(procedure); }}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                  {procedure.isCompleted ? t.audit.completedWithNoException : t.audit.pending}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                  procedure.isCompleted
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {procedure.isCompleted ? t.audit.completed : t.audit.pending}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div
                                className={`flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                              >
                                <button
                                  onClick={() => { toggleProcedureComplete(section.id, procedure.id); }}
                                  disabled={readOnly}
                                  className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                                >
                                  <FileText className="w-3 h-3" />
                                  {t.audit.memo}
                                </button>
                                <button className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                                  <Paperclip className="w-3 h-3" />
                                  {t.audit.attachments} ({procedure.attachments.length})
                                </button>
                                <button className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                                  <MessageSquare className="w-3 h-3" />
                                  {t.audit.observations} ({procedure.observations.length})
                                </button>
                                <button className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                                  <Eye className="w-3 h-3" />
                                  {t.audit.reviewComments} ({procedure.reviewComments.length})
                                </button>
                                {!readOnly && (
                                  <>
                                    <button
                                      onClick={() => { toggleProcedureComplete(section.id, procedure.id); }}
                                      className={`px-3 py-1 text-xs rounded transition-colors ${
                                        procedure.isCompleted
                                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                          : "bg-green-100 text-green-800 hover:bg-green-200"
                                      }`}
                                    >
                                      {procedure.isCompleted ? t.audit.revokeReview : t.audit.complete}
                                    </button>
                                    {section.canRemoveProcedures && (
                                      <button
                                        onClick={() => { removeProcedure(section.id, procedure.id); }}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p className="mb-4">{t.audit.noProceduresAdded}</p>
                  </div>
                )}

                {/* Add Procedure Button */}
                {section.canAddProcedures && !readOnly && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => { addProcedure(section.id); }}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      {t.audit.addProcedure}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}
