// Common types and enums
export const InvoiceType = {
  SALES: "SALES",
  PURCHASE: "PURCHASE",
} as const;

export const ContactType = {
  LEAD: "LEAD",
  PROSPECT: "PROSPECT",
  CUSTOMER: "CUSTOMER",
  SUPPLIER: "SUPPLIER",
} as const;

export const DealStage = {
  LEAD: "LEAD",
  QUALIFIED: "QUALIFIED",
  PROPOSAL: "PROPOSAL",
  NEGOTIATION: "NEGOTIATION",
  CLOSED_WON: "CLOSED_WON",
  CLOSED_LOST: "CLOSED_LOST",
} as const;

export const UserRole = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
  ACCOUNTANT: "ACCOUNTANT",
} as const;

export type InvoiceType = (typeof InvoiceType)[keyof typeof InvoiceType];
export type ContactType = (typeof ContactType)[keyof typeof ContactType];
export type DealStage = (typeof DealStage)[keyof typeof DealStage];
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
