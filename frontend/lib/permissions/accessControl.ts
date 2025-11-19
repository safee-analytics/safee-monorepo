import { createAccessControl } from "better-auth/plugins/access";

export const ac = createAccessControl({
  settings: [
    "view", // Can view settings
    "manage", // Can manage all settings
  ],
  organization: [
    "view", // View organization details
    "update", // Update organization info
    "delete", // Delete organization
    "transfer", // Transfer ownership
  ],
  team: [
    "view", // View team members
    "invite", // Invite new members
    "remove", // Remove members
    "update_roles", // Change member roles
  ],
  auditLogs: [
    "view", // View audit logs
    "export", // Export audit logs
  ],
  security: [
    "view", // View security settings
    "manage", // Manage security settings (2FA, password policy)
  ],
  storage: [
    "view", // View storage settings
    "manage", // Manage storage quotas and settings
  ],
  integrations: [
    "view", // View integrations
    "manage", // Add/remove integrations
  ],
  api: [
    "view", // View API keys
    "create", // Create API keys
    "revoke", // Revoke API keys
  ],
  database: [
    "view", // View database settings
    "manage", // Manage database (migrations, backups)
  ],
  invoiceStyles: [
    "view", // View invoice styles
    "manage", // Manage invoice styles
  ],
  audit: [
    "view", // View audit module
    "create", // Create audit cases
    "update", // Update audit cases
    "delete", // Delete audit cases
    "assign", // Assign audit cases
  ],
  accounting: [
    "view", // View accounting data
    "create", // Create transactions/invoices
    "update", // Update transactions/invoices
    "delete", // Delete transactions/invoices
    "export", // Export accounting data
  ],
  hr: [
    "view", // View HR data
    "create", // Create employee records
    "update", // Update employee records
    "delete", // Delete employee records
    "manage_payroll", // Manage payroll
  ],
  crm: [
    "view", // View CRM data
    "create", // Create contacts/deals
    "update", // Update contacts/deals
    "delete", // Delete contacts/deals
  ],
});

export const settingsPermissions = {
  profile: [], // Always accessible
  notifications: [], // Always accessible
  appearance: [], // Always accessible
  organization: ["organization:view"],
  team: ["team:view"],
  "audit-logs": ["auditLogs:view"],
  security: ["security:view"],
  storage: ["storage:view"],
  integrations: ["integrations:view"],
  api: ["api:view"],
  database: ["database:view"],
  "invoice-styles": ["invoiceStyles:view"],
} as const;

export const modulePermissions = {
  audit: ["audit:view"], // Requires audit view permission (will be added when cases module is implemented)
  hisabiq: ["accounting:view"], // Requires accounting view permission
  kanz: ["hr:view"], // Requires HR view permission
  nisbah: ["crm:view"], // Requires CRM view permission
} as const;

export const jobTitleRoleMapping = {
  // Auditors
  auditor: "auditor",
  "senior auditor": "senior_auditor",
  "audit manager": "audit_manager",
  "chief auditor": "admin",

  // Accounting
  accountant: "accountant",
  "senior accountant": "senior_accountant",
  "accounting manager": "accounting_manager",
  "chief financial officer": "admin",
  cfo: "admin",

  // HR
  "hr coordinator": "hr_coordinator",
  "hr manager": "hr_manager",
  "hr director": "admin",

  // Sales/CRM
  "sales representative": "sales_rep",
  "sales manager": "sales_manager",
  "crm manager": "admin",

  // General
  owner: "owner",
  admin: "admin",
  administrator: "admin",
  manager: "admin",
  employee: "member",
  "team member": "member",
} as const;

export const roleHierarchy = {
  owner: 0, // Highest authority - can manage everyone
  admin: 1, // Can manage managers and below
  manager: 2, // Can manage senior staff and below
  senior_member: 3, // Can manage members
  member: 4, // Standard member - cannot manage others
  viewer: 5, // Read-only - cannot manage others

  // Department-specific roles
  // Audit
  audit_manager: 2,
  senior_auditor: 3,
  auditor: 4,

  // Accounting
  accounting_manager: 2,
  senior_accountant: 3,
  accountant: 4,

  // HR
  hr_manager: 2,
  hr_coordinator: 3,

  // Sales/CRM
  sales_manager: 2,
  sales_rep: 4,
} as const;

export function canManageRole(roleA: string, roleB: string): boolean {
  if (roleA === "owner") return true;

  if (roleB === "owner") return false;

  const levelA = roleHierarchy[roleA as keyof typeof roleHierarchy] ?? 4;
  const levelB = roleHierarchy[roleB as keyof typeof roleHierarchy] ?? 4;

  return levelA < levelB;
}

export function getManageableRoles(role: string): string[] {
  if (role === "owner") {
    return Object.keys(roleHierarchy).filter((r) => r !== "owner");
  }

  const currentLevel = roleHierarchy[role as keyof typeof roleHierarchy] ?? 4;

  return Object.entries(roleHierarchy)
    .filter(([targetRole, targetLevel]) => {
      return targetRole !== "owner" && currentLevel < targetLevel;
    })
    .map(([roleName]) => roleName);
}
