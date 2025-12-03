import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FilterToken } from "@/components/audit/cases/CaseFilters";

interface CaseFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  auditType?: string;
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: FilterToken[];
  viewMode: "list" | "grid" | "kanban";
  sortBy?: string;
  isFavorite: boolean;
  createdAt: string;
  lastUsed?: string;
}

interface AuditState {
  casesViewMode: "list" | "grid" | "kanban";
  setCasesViewMode: (mode: "list" | "grid" | "kanban") => void;

  caseFilters: CaseFilters;
  setCaseFilters: (filters: CaseFilters) => void;
  clearCaseFilters: () => void;

  isCreateCaseModalOpen: boolean;
  setCreateCaseModalOpen: (open: boolean) => void;

  selectedCaseIds: string[];
  toggleCaseSelection: (id: string) => void;
  clearCaseSelection: () => void;
  selectAllCases: (ids: string[]) => void;

  // Saved views
  savedViews: SavedView[];
  activeView: string | null;
  saveView: (view: Omit<SavedView, "id" | "createdAt">) => void;
  deleteView: (id: string) => void;
  applyView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  toggleViewFavorite: (id: string) => void;
  updateView: (id: string, updates: Partial<SavedView>) => void;

  // Wizard state
  wizardDraft: Record<string, unknown> | null;
  saveWizardDraft: (data: Record<string, unknown>) => void;
  clearWizardDraft: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      casesViewMode: "list",
      setCasesViewMode: (mode) => set({ casesViewMode: mode }),

      caseFilters: {},
      setCaseFilters: (filters) => set({ caseFilters: filters }),
      clearCaseFilters: () => set({ caseFilters: {} }),

      isCreateCaseModalOpen: false,
      setCreateCaseModalOpen: (open) => set({ isCreateCaseModalOpen: open }),

      selectedCaseIds: [],
      toggleCaseSelection: (id) => {
        const selected = get().selectedCaseIds;
        if (selected.includes(id)) {
          set({ selectedCaseIds: selected.filter((selectedId) => selectedId !== id) });
        } else {
          set({ selectedCaseIds: [...selected, id] });
        }
      },
      clearCaseSelection: () => set({ selectedCaseIds: [] }),
      selectAllCases: (ids) => set({ selectedCaseIds: ids }),

      savedViews: [],
      activeView: null,
      saveView: (viewData) => {
        const newView: SavedView = {
          ...viewData,
          id: `view-${Date.now()}`,
          createdAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
        };
        set((state) => ({
          savedViews: [...state.savedViews, newView],
        }));
      },
      deleteView: (id) => {
        set((state) => ({
          savedViews: state.savedViews.filter((v) => v.id !== id),
          activeView: state.activeView === id ? null : state.activeView,
        }));
      },
      applyView: (id) => {
        const view = get().savedViews.find((v) => v.id === id);
        if (view) {
          // Update last used timestamp
          set((state) => ({
            savedViews: state.savedViews.map((v) =>
              v.id === id ? { ...v, lastUsed: new Date().toISOString() } : v,
            ),
            activeView: id,
            casesViewMode: view.viewMode,
          }));
        }
      },
      setActiveView: (id) => set({ activeView: id }),
      toggleViewFavorite: (id) => {
        set((state) => ({
          savedViews: state.savedViews.map((v) => (v.id === id ? { ...v, isFavorite: !v.isFavorite } : v)),
        }));
      },
      updateView: (id, updates) => {
        set((state) => ({
          savedViews: state.savedViews.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        }));
      },

      wizardDraft: null,
      saveWizardDraft: (data) => set({ wizardDraft: data }),
      clearWizardDraft: () => set({ wizardDraft: null }),
    }),
    {
      name: "safee-audit-storage",
      partialize: (state) => ({
        casesViewMode: state.casesViewMode,
        caseFilters: state.caseFilters,
        savedViews: state.savedViews,
        activeView: state.activeView,
      }),
    },
  ),
);
