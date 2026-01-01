export interface HRSectionResponse {
  id: string;
  sectionKey: string;
  sectionType: "self_service" | "management";
  displayName: string;
  description: string | null;
  path: string;
  requiredPermissions: string | null;
  minimumRole: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
}

export interface ModuleAccessResponse {
  modules: string[];
}

export interface HRSectionsResponse {
  sections: HRSectionResponse[];
}

export interface UpdateModuleAccessRequest {
  organizationId?: string;
  rules: ModuleAccessRule[];
}

export interface ModuleAccessRule {
  moduleKey: string;
  role: string;
  hasAccess: boolean;
}

export interface AssignResourceRequest {
  userId: string;
  resourceType: "audit_case" | "accounting_client" | "crm_lead" | "crm_deal" | "hr_department";
  resourceId: string;
  role?: string;
}

export interface ResourceAssignmentResponse {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  role: string | null;
  assignedBy: string | null;
  assignedAt: string;
  expiresAt: string | null;
}

export interface AssignedResourcesResponse {
  resourceIds: string[];
}
