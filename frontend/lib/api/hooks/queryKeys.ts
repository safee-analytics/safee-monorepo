// Query keys for React Query cache management
export const queryKeys = {
  user: {
    profile: ["user", "profile"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  storage: {
    files: (folderId?: string) => ["storage", "files", folderId] as const,
    file: (fileId: string) => ["storage", "file", fileId] as const,
    quota: ["storage", "quota"] as const,
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
} as const;
