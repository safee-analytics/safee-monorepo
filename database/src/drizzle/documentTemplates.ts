import { pgTable, text, timestamp, uuid, jsonb, boolean, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { documentTypeEnum } from "./_common.js";

/**
 * Document template settings per organization
 * Stores which Odoo report template to use for each document type
 */
export const documentTemplates = pgTable(
  "document_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Document type (invoice, bill, quote, delivery_note, purchase_order, payslip, etc.)
    documentType: documentTypeEnum("document_type").notNull(),

    // Odoo report template identifier (e.g., "account.report_invoice", "custom_template.report_invoice_modern")
    templateId: text("template_id").notNull(),

    // Display name for the template
    templateName: text("template_name").notNull(),

    // Template description
    templateDescription: text("template_description"),

    // Whether this is the active/default template for this document type
    isActive: boolean("is_active").notNull().default(true),

    // Custom template settings (colors, fonts, logo visibility, etc.)
    customizations: jsonb("customizations").$type<{
      showCompanyLogo?: boolean;
      showCompanyAddress?: boolean;
      primaryColor?: string;
      secondaryColor?: string;
      fontFamily?: string;
      fontSize?: number;
      showPaymentTerms?: boolean;
      showBankDetails?: boolean;
      showQRCode?: boolean;
      customFooterText?: string;
      customHeaderText?: string;
      [key: string]: unknown;
    }>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Only one active template per organization per document type
    uniqueActiveTemplate: unique().on(table.organizationId, table.documentType, table.isActive),
  }),
);

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;
