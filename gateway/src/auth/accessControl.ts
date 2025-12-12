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
} as const);

export const roleHierarchy: Record<string, number> = {
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
};

export function canManageRole(roleA: string, roleB: string): boolean {
  if (roleA === "owner") return true;

  if (roleB === "owner") return false;

  const levelA = roleHierarchy[roleA] ?? 4;
  const levelB = roleHierarchy[roleB] ?? 4;

  return levelA < levelB;
}

export const defaultRoles = {
  owner: {
    name: "Owner",
    description: "Full access to all resources and settings",
    permissions: [
      // Settings - full access
      "settings:view",
      "settings:manage",

      // Organization - full access
      "organization:view",
      "organization:update",
      "organization:delete",
      "organization:transfer",

      // Team - full access
      "team:view",
      "team:invite",
      "team:remove",
      "team:update_roles",

      // Audit Logs
      "auditLogs:view",
      "auditLogs:export",

      // Security
      "security:view",
      "security:manage",

      // Storage
      "storage:view",
      "storage:manage",

      // Integrations
      "integrations:view",
      "integrations:manage",

      // API
      "api:view",
      "api:create",
      "api:revoke",

      // Database
      "database:view",
      "database:manage",

      // Invoice Styles
      "invoiceStyles:view",
      "invoiceStyles:manage",

      // Business modules - full access
      "accounting:view",
      "accounting:create",
      "accounting:update",
      "accounting:delete",
      "accounting:export",
      "hr:view",
      "hr:create",
      "hr:update",
      "hr:delete",
      "hr:manage_payroll",
      "crm:view",
      "crm:create",
      "crm:update",
      "crm:delete",
    ],
  },
  admin: {
    name: "Admin",
    description: "Administrative access to most resources",
    permissions: [
      "settings:view",
      "organization:view",
      "organization:update",
      "team:view",
      "team:invite",
      "team:remove",
      "team:update_roles",
      "auditLogs:view",
      "auditLogs:export",
      "security:view",
      "security:manage",
      "storage:view",
      "storage:manage",
      "integrations:view",
      "integrations:manage",
      "api:view",
      "api:create",
      "api:revoke",
      "invoiceStyles:view",
      "invoiceStyles:manage",
      "accounting:view",
      "accounting:create",
      "accounting:update",
      "accounting:delete",
      "accounting:export",
      "hr:view",
      "hr:create",
      "hr:update",
      "hr:delete",
      "hr:manage_payroll",
      "crm:view",
      "crm:create",
      "crm:update",
      "crm:delete",
    ],
  },
  member: {
    name: "Member",
    description: "Standard member with view and basic edit access",
    permissions: [
      "settings:view",
      "organization:view",
      "team:view",
      "accounting:view",
      "accounting:create",
      "accounting:update",
      "hr:view",
      "crm:view",
      "crm:create",
      "crm:update",
    ],
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access to resources",
    permissions: [
      "settings:view",
      "organization:view",
      "team:view",
      "accounting:view",
      "hr:view",
      "crm:view",
    ],
  },
};
