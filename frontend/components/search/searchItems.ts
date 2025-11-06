import {
  FiHome,
  FiDollarSign,
  FiUsers,
  FiClipboard,
  FiFileText,
  FiSettings,
  FiBarChart,
  FiUserPlus,
  FiShoppingCart,
  FiUser,
  FiBell,
  FiCalendar,
  FiMoon,
  FiDownload,
  FiLogOut,
} from 'react-icons/fi'

export interface SearchItem {
  id: string
  type: 'navigation' | 'action'
  icon: any
  label: string
  description: string
  path: string
  keywords: string[]
}

export const getNavigationItems = (t: any): SearchItem[] => [
  // Main Modules
  {
    id: 'nav-home',
    type: 'navigation',
    icon: FiHome,
    label: t.nav?.dashboard || 'Dashboard',
    description: 'Go to dashboard',
    path: '/',
    keywords: ['home', 'dashboard', 'main']
  },
  {
    id: 'nav-accounting',
    type: 'navigation',
    icon: FiDollarSign,
    label: t.nav?.hisabiq || 'Hisabiq',
    description: 'Accounting & Finance',
    path: '/accounting',
    keywords: ['accounting', 'finance', 'money', 'hisabiq', 'invoice']
  },
  {
    id: 'nav-hr',
    type: 'navigation',
    icon: FiUsers,
    label: t.nav?.kanz || 'Kanz',
    description: 'HR & Payroll',
    path: '/hr',
    keywords: ['hr', 'payroll', 'employees', 'kanz', 'staff']
  },
  {
    id: 'nav-crm',
    type: 'navigation',
    icon: FiUserPlus,
    label: t.nav?.nisbah || 'Nisbah',
    description: 'CRM & Customers',
    path: '/crm',
    keywords: ['crm', 'customers', 'contacts', 'nisbah', 'clients']
  },
  {
    id: 'nav-audit',
    type: 'navigation',
    icon: FiClipboard,
    label: t.nav?.audit || 'Audit',
    description: 'Audit & Compliance',
    path: '/audit',
    keywords: ['audit', 'compliance', 'review']
  },
  // Audit Sub-pages
  {
    id: 'nav-audit-cases',
    type: 'navigation',
    icon: FiClipboard,
    label: 'Case Management',
    description: 'Manage audit cases',
    path: '/audit/cases',
    keywords: ['audit', 'cases', 'case', 'management']
  },
  {
    id: 'nav-audit-dashboard',
    type: 'navigation',
    icon: FiBarChart,
    label: 'Audit Dashboard',
    description: 'View audit analytics',
    path: '/audit/dashboard',
    keywords: ['audit', 'dashboard', 'analytics', 'overview']
  },
  {
    id: 'nav-audit-planning',
    type: 'navigation',
    icon: FiCalendar,
    label: 'Audit Planning',
    description: 'Plan audit activities',
    path: '/audit/planning',
    keywords: ['audit', 'planning', 'plan', 'schedule']
  },
  {
    id: 'nav-audit-team',
    type: 'navigation',
    icon: FiUsers,
    label: 'Audit Team',
    description: 'Manage audit team members',
    path: '/audit/team',
    keywords: ['audit', 'team', 'members', 'auditors']
  },
  {
    id: 'nav-audit-documents',
    type: 'navigation',
    icon: FiFileText,
    label: 'Audit Documents',
    description: 'Manage audit documents',
    path: '/audit/documents',
    keywords: ['audit', 'documents', 'files', 'doc']
  },
  {
    id: 'nav-audit-reports',
    type: 'navigation',
    icon: FiBarChart,
    label: 'Audit Reports',
    description: 'View audit reports',
    path: '/audit/reports',
    keywords: ['audit', 'reports', 'report']
  },
  // Settings
  {
    id: 'nav-settings',
    type: 'navigation',
    icon: FiSettings,
    label: t.common?.settings || 'Settings',
    description: 'App settings',
    path: '/settings',
    keywords: ['settings', 'preferences', 'config']
  },
  {
    id: 'nav-settings-profile',
    type: 'navigation',
    icon: FiUser,
    label: 'Profile Settings',
    description: 'Manage your profile',
    path: '/settings/profile',
    keywords: ['settings', 'profile', 'account', 'user']
  },
  {
    id: 'nav-settings-security',
    type: 'navigation',
    icon: FiSettings,
    label: 'Security Settings',
    description: 'Manage security preferences',
    path: '/settings/security',
    keywords: ['settings', 'security', 'password', 'authentication']
  },
  {
    id: 'nav-settings-notifications',
    type: 'navigation',
    icon: FiBell,
    label: 'Notification Settings',
    description: 'Manage notifications',
    path: '/settings/notifications',
    keywords: ['settings', 'notifications', 'alerts', 'email']
  },
  {
    id: 'nav-settings-appearance',
    type: 'navigation',
    icon: FiMoon,
    label: 'Appearance Settings',
    description: 'Customize appearance',
    path: '/settings/appearance',
    keywords: ['settings', 'appearance', 'theme', 'display']
  },
  {
    id: 'nav-settings-integrations',
    type: 'navigation',
    icon: FiSettings,
    label: 'Integrations',
    description: 'Manage integrations',
    path: '/settings/integrations',
    keywords: ['settings', 'integrations', 'apps', 'connect']
  },
  {
    id: 'nav-settings-api',
    type: 'navigation',
    icon: FiSettings,
    label: 'API Settings',
    description: 'Manage API keys',
    path: '/settings/api',
    keywords: ['settings', 'api', 'keys', 'tokens', 'developer']
  },
  {
    id: 'nav-settings-database',
    type: 'navigation',
    icon: FiSettings,
    label: 'Database Settings',
    description: 'Manage database',
    path: '/settings/database',
    keywords: ['settings', 'database', 'data', 'backup']
  },
  {
    id: 'nav-settings-storage',
    type: 'navigation',
    icon: FiSettings,
    label: 'Storage Settings',
    description: 'Manage storage',
    path: '/settings/storage',
    keywords: ['settings', 'storage', 'space', 'files']
  },
  // Reports
  {
    id: 'nav-reports',
    type: 'navigation',
    icon: FiBarChart,
    label: t.common?.reports || 'Reports',
    description: 'Reports & Analytics',
    path: '/reports',
    keywords: ['reports', 'analytics', 'insights', 'data']
  },
]

export const getQuickActions = (t: any, signOut: () => void, onExport?: () => void, onThemeToggle?: () => void, theme?: 'light' | 'dark'): SearchItem[] => [
  // Create Actions (future functionality - currently lead to module homes)
  {
    id: 'action-invoice',
    type: 'action',
    icon: FiFileText,
    label: t.hisabiq?.createMenu?.invoice || 'Create Invoice',
    description: 'Create a new invoice',
    path: '/accounting',
    keywords: ['create', 'new', 'invoice', 'bill']
  },
  {
    id: 'action-employee',
    type: 'action',
    icon: FiUsers,
    label: t.kanz?.createMenu?.addEmployee || 'Add Employee',
    description: 'Add a new employee',
    path: '/hr',
    keywords: ['add', 'new', 'employee', 'staff', 'hire']
  },
  {
    id: 'action-contact',
    type: 'action',
    icon: FiUserPlus,
    label: t.nisbah?.createMenu?.contact || 'Add Contact',
    description: 'Add a new contact',
    path: '/crm',
    keywords: ['add', 'new', 'contact', 'customer', 'client']
  },
  {
    id: 'action-expense',
    type: 'action',
    icon: FiShoppingCart,
    label: t.hisabiq?.createMenu?.expense || 'Record Expense',
    description: 'Record a new expense',
    path: '/accounting',
    keywords: ['expense', 'spending', 'cost', 'purchase']
  },
]

export const getSystemActions = (t: any, signOut: () => void, onExport?: () => void, onThemeToggle?: () => void, theme?: 'light' | 'dark'): SearchItem[] => {
  const actions: SearchItem[] = []

  if (onExport) {
    actions.push({
      id: 'action-export',
      type: 'action',
      icon: FiDownload,
      label: 'Export Data',
      description: 'Export current view to CSV/Excel',
      path: '#export',
      keywords: ['export', 'download', 'csv', 'excel', 'data']
    })
  }

  if (onThemeToggle) {
    actions.push({
      id: 'action-theme',
      type: 'action',
      icon: theme === 'light' ? FiMoon : FiMoon,
      label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      description: 'Toggle between light and dark theme',
      path: '#theme',
      keywords: ['theme', 'dark', 'light', 'mode', 'appearance']
    })
  }

  actions.push({
    id: 'action-logout',
    type: 'action',
    icon: FiLogOut,
    label: t.auth?.logout || 'Logout',
    description: 'Sign out of your account',
    path: '#logout',
    keywords: ['logout', 'sign out', 'exit', 'leave']
  })

  return actions
}
