import { uuid, varchar, timestamp, boolean, text, jsonb, index } from "drizzle-orm/pg-core";
import { casesSchema, idpk, templateTypeEnum, caseCategoryEnum } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const templates = casesSchema.table(
  "templates",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    templateType: templateTypeEnum("template_type").notNull(),
    category: caseCategoryEnum("category"),
    version: varchar("version", { length: 50 }).notNull().default("1.0"),
    isActive: boolean("is_active").notNull().default(true),
    isSystemTemplate: boolean("is_system_template").notNull().default(false),
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
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("templates_organization_id_idx").on(table.organizationId),
    index("templates_template_type_idx").on(table.templateType),
    index("templates_is_active_idx").on(table.isActive),
    index("templates_is_system_template_idx").on(table.isSystemTemplate),
  ],
);

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
