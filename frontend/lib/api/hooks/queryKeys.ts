// Query keys for React Query cache management
export const queryKeys = {
  user: {
    profile: ["user", "profile"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  activity: {
    all: ["activity"] as const,
  },
  storage: {
    files: (folderId?: string) => ["storage", "files", folderId] as const,
    file: (fileId: string) => ["storage", "file", fileId] as const,
    quota: ["storage", "quota"] as const,
    config: ["storage", "config"] as const,
    info: ["storage", "info"] as const,
  },
  cases: {
    all: ["cases"] as const,
    list: (filters?: { status?: string; priority?: string; assignedTo?: string }) =>
      ["cases", "list", filters] as const,
    detail: (id: string) => ["cases", "detail", id] as const,
    templates: ["cases", "templates"] as const,
    template: (templateId: string) => ["cases", "templates", templateId] as const,
    scopes: (caseId: string) => ["cases", caseId, "scopes"] as const,
    sections: (caseId: string, scopeId: string) => ["cases", caseId, "scopes", scopeId, "sections"] as const,
    procedures: (caseId: string, scopeId: string, sectionId: string) =>
      ["cases", caseId, "scopes", scopeId, "sections", sectionId, "procedures"] as const,
    documents: (caseId: string) => ["cases", caseId, "documents"] as const,
    notes: (caseId: string) => ["cases", caseId, "notes"] as const,
    assignments: (caseId: string) => ["cases", caseId, "assignments"] as const,
    history: (caseId: string) => ["cases", caseId, "history"] as const,
  },
  workflows: {
    all: ["workflows"] as const,
    list: (entityType?: string) => ["workflows", "list", entityType] as const,
    detail: (id: string) => ["workflows", "detail", id] as const,
  },
  approvalRules: {
    all: ["approval-rules"] as const,
    list: (entityType?: string) => ["approval-rules", "list", entityType] as const,
    detail: (id: string) => ["approval-rules", "detail", id] as const,
  },
  approvals: {
    all: ["approvals"] as const,
    requests: (status?: string) => ["approvals", "requests", status] as const,
    request: (id: string) => ["approvals", "request", id] as const,
    history: (entityType: string, entityId: string) =>
      ["approvals", "history", entityType, entityId] as const,
  },
  accounting: {
    invoices: (params?: {
      page?: number;
      limit?: number;
      type?: "SALES" | "PURCHASE";
      state?: "draft" | "posted" | "cancel";
      dateFrom?: string;
      dateTo?: string;
    }) => ["accounting", "invoices", params] as const,
    invoice: (id: string) => ["accounting", "invoice", id] as const,
    bills: (params?: {
      page?: number;
      limit?: number;
      state?: "draft" | "posted" | "cancel";
      dateFrom?: string;
      dateTo?: string;
    }) => ["accounting", "bills", params] as const,
    bill: (id: string) => ["accounting", "bill", id] as const,
    payments: (params?: {
      type?: "inbound" | "outbound" | "transfer";
      state?: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
      dateFrom?: string;
      dateTo?: string;
    }) => ["accounting", "payments", params] as const,
    accounts: (type?: string) => ["accounting", "accounts", type] as const,
    partners: (filters?: { isCustomer?: boolean; isSupplier?: boolean }) =>
      ["accounting", "partners", filters] as const,
    journals: (type?: string) => ["accounting", "journals", type] as const,
    taxes: (type?: string) => ["accounting", "taxes", type] as const,
    paymentTerms: ["accounting", "payment-terms"] as const,
    bankStatements: (params?: {
      journalId?: number;
      dateFrom?: string;
      dateTo?: string;
      state?: "open" | "confirm";
    }) => ["accounting", "bank-statements", params] as const,
    bankStatementLines: (statementId: number) =>
      ["accounting", "bank-statements", statementId, "lines"] as const,
    reconciliationSuggestions: (lineId: number) => ["accounting", "reconciliation", lineId] as const,
    currencies: (onlyActive?: boolean) => ["accounting", "currencies", onlyActive] as const,
    currencyRates: (params?: { currencyId?: number; dateFrom?: string; dateTo?: string }) =>
      ["accounting", "currency-rates", params] as const,
    reports: {
      trialBalance: (params?: { accountIds?: number[]; dateFrom?: string; dateTo?: string }) =>
        ["accounting", "reports", "trial-balance", params] as const,
      partnerLedger: (params?: { partnerId?: number; dateFrom?: string; dateTo?: string }) =>
        ["accounting", "reports", "partner-ledger", params] as const,
      profitLoss: (dateFrom?: string, dateTo?: string) =>
        ["accounting", "reports", "profit-loss", dateFrom, dateTo] as const,
      generalLedger: (params?: {
        accountId?: number;
        partnerId?: number;
        dateFrom?: string;
        dateTo?: string;
      }) => ["accounting", "reports", "general-ledger", params] as const,
      agedReceivable: (asOfDate?: string) => ["accounting", "reports", "aged-receivable", asOfDate] as const,
      agedPayable: (asOfDate?: string) => ["accounting", "reports", "aged-payable", asOfDate] as const,
    },
  },
  hr: {
    // Employee and department management (CRUD)
    employees: (filters?: { departmentId?: string; managerId?: string }) =>
      ["hr", "management", "employees", filters] as const,
    employee: (id: string) => ["hr", "management", "employees", id] as const,
    departments: (filters?: { parentId?: string }) => ["hr", "management", "departments", filters] as const,
    department: (id: string) => ["hr", "management", "departments", id] as const,
    leaveBalances: (employeeId: string) =>
      ["hr", "management", "employees", employeeId, "leave-balances"] as const,
    leaveBalance: (employeeId: string, leaveTypeId: string) =>
      ["hr", "management", "employees", employeeId, "leave-balances", leaveTypeId] as const,

    // Contracts, leaves, and payroll data
    contracts: (filters?: { employeeId?: number; state?: string }) => ["hr", "contracts", filters] as const,
    contract: (id: number) => ["hr", "contracts", id] as const,
    leaveRequests: (filters?: { employeeId?: number; state?: string }) =>
      ["hr", "leave-requests", filters] as const,
    leaveTypes: () => ["hr", "leave-types"] as const,
    leaveAllocations: (filters?: { employeeId?: number }) => ["hr", "leave-allocations", filters] as const,
    payslips: (filters?: { employeeId?: number; dateFrom?: string; dateTo?: string }) =>
      ["hr", "payslips", filters] as const,
    payslip: (id: number) => ["hr", "payslips", id] as const,
    payslipLines: (payslipId: number) => ["hr", "payslips", payslipId, "lines"] as const,
  },
  settings: {
    documentTemplates: () => ["settings", "document-templates"] as const,
    documentTemplatesByType: (documentType: string) =>
      ["settings", "document-templates", "by-type", documentType] as const,
    activeTemplate: (documentType?: string) =>
      ["settings", "document-templates", "active", documentType] as const,
    odooTemplates: (model?: string) => ["settings", "odoo-templates", model] as const,
  },
  database: {
    stats: ["database", "stats"] as const,
    backupSettings: ["database", "backup", "settings"] as const,
    backups: ["database", "backups"] as const,
  },
  apiKeys: {
    all: ["api-keys"] as const,
    permissions: ["api-keys", "permissions"] as const,
  },
  security: {
    settings: ["security", "settings"] as const,
    sessions: ["security", "sessions"] as const,
  },
  integrations: {
    all: ["integrations"] as const,
  },
  crm: {
    leads: (params?: {
      type?: "lead" | "opportunity";
      stageId?: number;
      teamId?: number;
      userId?: number;
      partnerId?: number;
      active?: boolean;
    }) => ["crm", "leads", params] as const,
    lead: (id: number) => ["crm", "leads", id] as const,
    stages: (params?: { teamId?: number; isWon?: boolean }) => ["crm", "stages", params] as const,
    stage: (id: number) => ["crm", "stages", id] as const,
    contacts: (params?: { isCustomer?: boolean; isSupplier?: boolean; isCompany?: boolean }) =>
      ["crm", "contacts", params] as const,
    contact: (id: number) => ["crm", "contacts", id] as const,
    activities: (params?: { leadId?: number; userId?: number; state?: string }) =>
      ["crm", "activities", params] as const,
    activity: (id: number) => ["crm", "activities", id] as const,
    teams: (params?: { active?: boolean }) => ["crm", "teams", params] as const,
    team: (id: number) => ["crm", "teams", id] as const,
    lostReasons: (params?: { active?: boolean }) => ["crm", "lost-reasons", params] as const,
    lostReason: (id: number) => ["crm", "lost-reasons", id] as const,
  },
} as const;
