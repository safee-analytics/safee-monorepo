import { text, timestamp, uuid, jsonb, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";
import { documentTypeEnum, systemSchema } from "./_common.js";

export const documentTemplates = systemSchema.table(
  "document_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    documentType: documentTypeEnum("document_type").notNull(),

    templateId: text("template_id").notNull(),

    templateName: text("template_name").notNull(),

    templateDescription: text("template_description"),

    isActive: boolean("is_active").notNull().default(true),

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
  (table) => [
    uniqueIndex("document_templates_org_type_active_unique").on(
      table.organizationId,
      table.documentType,
      table.isActive,
    ),
  ],
);

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;
