import { pgSchema, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

export const identitySchema = pgSchema("identity");
export const financeSchema = pgSchema("finance");
export const hrSchema = pgSchema("hr");
export const salesSchema = pgSchema("sales");
export const systemSchema = pgSchema("system");

export const userRoleEnum = identitySchema.enum("user_role", ["ADMIN", "MANAGER", "EMPLOYEE", "ACCOUNTANT"]);

export const invoiceTypeEnum = financeSchema.enum("invoice_type", ["SALES", "PURCHASE"]);

export const contactTypeEnum = salesSchema.enum("contact_type", ["LEAD", "PROSPECT", "CUSTOMER", "SUPPLIER"]);

export const dealStageEnum = salesSchema.enum("deal_stage", [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
]);

export type InvoiceType = (typeof invoiceTypeEnum.enumValues)[number];
export type ContactType = (typeof contactTypeEnum.enumValues)[number];
export type DealStage = (typeof dealStageEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const schemas = {
  identity: identitySchema,
  finance: financeSchema,
  hr: hrSchema,
  sales: salesSchema,
  system: systemSchema,
} as const;
