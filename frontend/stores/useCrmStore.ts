import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LeadFilters {
  type?: "lead" | "opportunity";
  stageId?: number;
  teamId?: number;
  userId?: number;
  partnerId?: number;
  active?: boolean;
}

interface ContactFilters {
  isCustomer?: boolean;
  isSupplier?: boolean;
  isCompany?: boolean;
}

interface ActivityFilters {
  leadId?: number;
  userId?: number;
  state?: string;
}

interface CrmState {
  leadsViewMode: "kanban" | "table";
  setLeadsViewMode: (mode: "kanban" | "table") => void;

  leadFilters: LeadFilters;
  setLeadFilters: (filters: LeadFilters) => void;
  clearLeadFilters: () => void;

  contactFilters: ContactFilters;
  setContactFilters: (filters: ContactFilters) => void;
  clearContactFilters: () => void;

  activityFilters: ActivityFilters;
  setActivityFilters: (filters: ActivityFilters) => void;
  clearActivityFilters: () => void;

  isQuickLeadModalOpen: boolean;
  setQuickLeadModalOpen: (open: boolean) => void;

  selectedLeadIds: number[];
  toggleLeadSelection: (id: number) => void;
  clearLeadSelection: () => void;
  selectAllLeads: (ids: number[]) => void;

  draggedLeadId: number | null;
  setDraggedLeadId: (id: number | null) => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      leadsViewMode: "kanban",
      setLeadsViewMode: (mode) => set({ leadsViewMode: mode }),

      leadFilters: {},
      setLeadFilters: (filters) => set({ leadFilters: filters }),
      clearLeadFilters: () => set({ leadFilters: {} }),

      contactFilters: {},
      setContactFilters: (filters) => set({ contactFilters: filters }),
      clearContactFilters: () => set({ contactFilters: {} }),

      activityFilters: {},
      setActivityFilters: (filters) => set({ activityFilters: filters }),
      clearActivityFilters: () => set({ activityFilters: {} }),

      isQuickLeadModalOpen: false,
      setQuickLeadModalOpen: (open) => set({ isQuickLeadModalOpen: open }),

      selectedLeadIds: [],
      toggleLeadSelection: (id) => {
        const selected = get().selectedLeadIds;
        if (selected.includes(id)) {
          set({ selectedLeadIds: selected.filter((selectedId) => selectedId !== id) });
        } else {
          set({ selectedLeadIds: [...selected, id] });
        }
      },
      clearLeadSelection: () => set({ selectedLeadIds: [] }),
      selectAllLeads: (ids) => set({ selectedLeadIds: ids }),

      draggedLeadId: null,
      setDraggedLeadId: (id) => set({ draggedLeadId: id }),
    }),
    {
      name: "safee-crm-storage",
      partialize: (state) => ({
        leadsViewMode: state.leadsViewMode,
        leadFilters: state.leadFilters,
        contactFilters: state.contactFilters,
        activityFilters: state.activityFilters,
      }),
    },
  ),
);
