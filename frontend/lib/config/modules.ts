/**
 * Module Configuration
 *
 * This file defines the core modules of the application.
 * Update these values to rename modules throughout the app.
 */

export const MODULES = {
  ACCOUNTING: {
    id: 'accounting',
    key: 'hisabiq' as const,
    name: {
      en: 'Accounting',
      ar: 'المحاسبة'
    },
    icon: '📊',
    path: '/accounting',
    description: {
      en: 'Accounting & Finance',
      ar: 'المحاسبة والمالية'
    }
  },
  HR: {
    id: 'hr',
    key: 'kanz' as const,
    name: {
      en: 'HR',
      ar: 'الموارد البشرية'
    },
    icon: '👥',
    path: '/hr',
    description: {
      en: 'Human Resources & Payroll',
      ar: 'الموارد البشرية والرواتب'
    }
  },
  CRM: {
    id: 'crm',
    key: 'nisbah' as const,
    name: {
      en: 'CRM',
      ar: 'إدارة العملاء'
    },
    icon: '🤝',
    path: '/crm',
    description: {
      en: 'Customer Relationship Management',
      ar: 'إدارة علاقات العملاء'
    }
  }
} as const

export type ModuleKey = typeof MODULES[keyof typeof MODULES]['key']
export type ModulePath = typeof MODULES[keyof typeof MODULES]['path']

// Helper function to get module by key
export function getModuleByKey(key: string) {
  return Object.values(MODULES).find(m => m.key === key)
}

// Helper function to get all modules as array
export function getAllModules() {
  return Object.values(MODULES)
}
