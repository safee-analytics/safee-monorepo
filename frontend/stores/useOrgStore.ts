import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Organization {
  id: string;
  name: string;
  logo?: string | null;
  modules: ("hisabiq" | "kanz" | "nisbah" | "audit")[];
}

interface User {
  id: string;
  name: string;
  email: string;
  permissions: Record<string, string[]>;
}

interface OrgStore {
  currentOrg: Organization | null;
  currentUser: User | null;
  currentModule: "hisabiq" | "kanz" | "nisbah" | "audit";
  locale: "ar" | "en";
  sidebarAutoClose: boolean;
  sidebarCollapsed: boolean;

  // Actions
  setOrg: (org: Organization) => void;
  setUser: (user: User) => void;
  setModule: (module: "hisabiq" | "kanz" | "nisbah" | "audit") => void;
  setLocale: (locale: "ar" | "en") => void;
  setSidebarAutoClose: (autoClose: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  clearSession: () => void;
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      currentUser: null,
      currentModule: "hisabiq",
      locale: "en",
      sidebarAutoClose: true,
      sidebarCollapsed: false,

      setOrg: (org) => set({ currentOrg: org }),
      setUser: (user) => set({ currentUser: user }),
      setModule: (module) => set({ currentModule: module }),
      setLocale: (locale) => set({ locale }),
      setSidebarAutoClose: (autoClose) => set({ sidebarAutoClose: autoClose }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      clearSession: () =>
        set({
          currentOrg: null,
          currentUser: null,
          currentModule: "hisabiq",
        }),
    }),
    {
      name: "safee-org-storage",
    },
  ),
);
