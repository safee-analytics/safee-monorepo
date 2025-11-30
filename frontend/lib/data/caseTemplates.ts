/**
 * Sample Case Templates for Audit Module
 * These templates provide pre-configured structures for common audit types
 */

export interface CaseTemplateData {
  name: string;
  description: string;
  auditType: string;
  priority: string;
  estimatedDuration: number; // in days
  icon: string;
  color: string;
  defaultFields: {
    status?: string;
    [key: string]: unknown;
  };
  documentCategories: string[];
  checklistItems?: string[];
}

export const SAMPLE_TEMPLATES: CaseTemplateData[] = [
  {
    name: "Financial Audit",
    description:
      "Comprehensive financial statement audit including balance sheet, income statement, and cash flow analysis",
    auditType: "financial_audit",
    priority: "high",
    estimatedDuration: 45,
    icon: "💰",
    color: "blue",
    defaultFields: {
      status: "pending",
    },
    documentCategories: [
      "Financial Statements",
      "Bank Statements",
      "Trial Balance",
      "General Ledger",
      "Tax Returns",
      "Supporting Schedules",
      "Audit Reports",
    ],
    checklistItems: [
      "Review prior year audit files",
      "Obtain financial statements",
      "Verify bank reconciliations",
      "Test revenue recognition",
      "Test expense classifications",
      "Review accounts receivable aging",
      "Verify inventory valuations",
      "Test fixed asset additions",
      "Review journal entries",
      "Prepare audit findings",
      "Draft audit report",
      "Management letter preparation",
    ],
  },
  {
    name: "Compliance Audit",
    description:
      "Regulatory compliance review covering policies, procedures, and adherence to applicable standards",
    auditType: "compliance_audit",
    priority: "high",
    estimatedDuration: 30,
    icon: "✅",
    color: "green",
    defaultFields: {
      status: "pending",
    },
    documentCategories: [
      "Policies & Procedures",
      "Regulatory Requirements",
      "Compliance Certificates",
      "Training Records",
      "Incident Reports",
      "Audit Evidence",
      "Compliance Reports",
    ],
    checklistItems: [
      "Identify applicable regulations",
      "Review company policies",
      "Test compliance controls",
      "Interview key personnel",
      "Review training documentation",
      "Assess risk areas",
      "Test sample transactions",
      "Document findings",
      "Prepare compliance report",
      "Recommend improvements",
    ],
  },
  {
    name: "ICV Audit",
    description:
      "In-Country Value (ICV) certification audit for UAE-based companies to measure local economic contribution",
    auditType: "icv_audit",
    priority: "medium",
    estimatedDuration: 20,
    icon: "🇦🇪",
    color: "purple",
    defaultFields: {
      status: "pending",
    },
    documentCategories: [
      "Financial Data",
      "Supplier Contracts",
      "Employee Records",
      "Investment Documentation",
      "Emiratization Evidence",
      "Cost Breakdowns",
      "ICV Certificate",
    ],
    checklistItems: [
      "Collect financial statements",
      "Verify goods manufactured in UAE",
      "Calculate Emiratization percentage",
      "Review supplier contracts",
      "Verify investments in UAE",
      "Calculate ICV score components",
      "Prepare ICV calculation sheets",
      "Submit for certification",
      "Obtain ICV certificate",
    ],
  },
  {
    name: "General Audit",
    description: "Flexible template for custom audit engagements with standard documentation structure",
    auditType: "general_audit",
    priority: "medium",
    estimatedDuration: 30,
    icon: "📋",
    color: "gray",
    defaultFields: {
      status: "pending",
    },
    documentCategories: [
      "Planning Documents",
      "Client Information",
      "Audit Evidence",
      "Working Papers",
      "Communications",
      "Final Reports",
    ],
    checklistItems: [
      "Define audit scope",
      "Conduct risk assessment",
      "Develop audit plan",
      "Gather documentation",
      "Perform fieldwork",
      "Document findings",
      "Review with client",
      "Finalize audit report",
    ],
  },
];

/**
 * Get template by audit type
 */
export function getTemplateByType(auditType: string): CaseTemplateData | undefined {
  return SAMPLE_TEMPLATES.find((t) => t.auditType === auditType);
}

/**
 * Get template display name for UI
 */
export function getTemplateDisplayName(auditType: string): string {
  const template = getTemplateByType(auditType);
  return template?.name || auditType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get suggested due date based on template's estimated duration
 */
export function getSuggestedDueDate(template: CaseTemplateData): Date {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + template.estimatedDuration);
  return dueDate;
}
