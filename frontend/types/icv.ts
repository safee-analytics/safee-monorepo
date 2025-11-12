export interface ICVProcedure {
  id: string;
  step: string;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  attachments: string[];
  observations: string[];
  reviewComments: string[];
  memo?: string;
  canEdit: boolean;
}

export interface ICVSection {
  id: string;
  name: string;
  isCompleted: boolean;
  isCollapsed: boolean;
  procedures: ICVProcedure[];
  canAddProcedures: boolean;
  canRemoveProcedures: boolean;
}

export type ICVStatus = "Draft" | "In Progress" | "Under Review" | "Completed" | "Archived";

export interface ICVScope {
  id: string;
  name: string;
  description: string;
  sections: ICVSection[];
  status: ICVStatus;
  isTemplate: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  completedBy?: string;
  archivedAt?: string;
  archivedBy?: string;
}

export const DEFAULT_ICV_SCOPE: ICVScope = {
  id: "icv-default",
  name: "ICV Certification Scope",
  description: "Standard ICV certification engagement scope",
  status: "In Progress",
  isTemplate: true,
  createdBy: "system",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "financial-statements",
      name: "FINANCIAL STATEMENTS & CR",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [
        {
          id: "fs-1",
          step: "2.1",
          description: "Audited Financial statements",
          isRequired: true,
          isCompleted: false,
          attachments: [],
          observations: [],
          reviewComments: [],
          canEdit: true,
        },
        {
          id: "fs-2",
          step: "3.1",
          description: "Updated commercial registration",
          isRequired: true,
          isCompleted: false,
          attachments: [],
          observations: [],
          reviewComments: [],
          canEdit: true,
        },
      ],
    },
    {
      id: "client-engagement",
      name: "CLIENT & ENGAGEMENT ACCEPTANCE",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "working-files",
      name: "WORKING FILES",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "general",
      name: "GENERAL",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "a1-goods",
      name: "A1. Goods",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "a2-services",
      name: "A2. Services",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "b-workforce-training",
      name: "B. Workforce training",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "c-supplier-development",
      name: "C. Supplier Development",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "d-investment-fixed-assets",
      name: "D. Investment in fixed assets",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "e-total-cost",
      name: "E. Total Cost",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
    {
      id: "completion",
      name: "Completion",
      isCompleted: false,
      isCollapsed: false,
      canAddProcedures: true,
      canRemoveProcedures: true,
      procedures: [],
    },
  ],
};
