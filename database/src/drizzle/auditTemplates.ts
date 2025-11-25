import { uuid, varchar, timestamp, boolean, text, jsonb, index } from "drizzle-orm/pg-core";
import { auditSchema, idpk, auditTypeEnum, auditCategoryEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const auditTemplates = auditSchema.table(
  "audit_templates",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }), // null = global template
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    auditType: auditTypeEnum("audit_type").notNull(),
    category: auditCategoryEnum("category"),
    version: varchar("version", { length: 50 }).notNull().default("1.0"),
    isActive: boolean("is_active").notNull().default(true),
    isPublic: boolean("is_public").notNull().default(false), // Available to all organizations
    structure: jsonb("structure").notNull().$type<{
      sections: {
        name: string;
        description?: string;
        sortOrder: number;
        settings?: Record<string, unknown>;
        procedures: {
          referenceNumber: string;
          title: string;
          description?: string;
          requirements?: {
            isRequired?: boolean;
            minAttachments?: number;
            maxAttachments?: number;
            requiresObservations?: boolean;
            requiresReviewComment?: boolean;
            allowedFileTypes?: string[];
            customFields?: {
              name: string;
              type: string;
              required: boolean;
              validation?: Record<string, unknown>;
              options?: string[];
            }[];
          };
          sortOrder: number;
        }[];
      }[];
      settings?: Record<string, unknown>;
    }>(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_templates_organization_id_idx").on(table.organizationId),
    index("audit_templates_audit_type_idx").on(table.auditType),
    index("audit_templates_is_active_idx").on(table.isActive),
    index("audit_templates_is_public_idx").on(table.isPublic),
  ],
);

export type AuditTemplate = typeof auditTemplates.$inferSelect;
export type NewAuditTemplate = typeof auditTemplates.$inferInsert;
