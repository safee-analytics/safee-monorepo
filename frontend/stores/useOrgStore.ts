import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Organization {
  id: string
  name: string
  modules: ('hisabiq' | 'kanz' | 'nisbah')[]
}

interface User {
  id: string
  name: string
  email: string
  permissions: Record<string, string[]>
}

interface OrgStore {
  currentOrg: Organization | null
  currentUser: User | null
  currentModule: 'hisabiq' | 'kanz' | 'nisbah'
  locale: 'ar' | 'en'

  // Actions
  setOrg: (org: Organization) => void
  setUser: (user: User) => void
  setModule: (module: 'hisabiq' | 'kanz' | 'nisbah') => void
  setLocale: (locale: 'ar' | 'en') => void
  clearSession: () => void
}

export const useOrgStore = create<OrgStore>()(
  persist(
    (set) => ({
      currentOrg: null,
      currentUser: null,
      currentModule: 'hisabiq',
      locale: 'ar',

      setOrg: (org) => set({ currentOrg: org }),
      setUser: (user) => set({ currentUser: user }),
      setModule: (module) => set({ currentModule: module }),
      setLocale: (locale) => set({ locale }),
      clearSession: () => set({
        currentOrg: null,
        currentUser: null,
        currentModule: 'hisabiq'
      })
    }),
    {
      name: 'safee-org-storage',
    }
  )
)
