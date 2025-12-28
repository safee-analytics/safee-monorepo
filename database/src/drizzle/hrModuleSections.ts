import { varchar, text, integer, boolean } from "drizzle-orm/pg-core";
import { hrSchema, idpk } from "./_common.js";

export const hrSectionTypeEnum = hrSchema.enum("section_type", ["self_service", "management"]);

export const hrModuleSections = hrSchema.table("module_sections", {
  id: idpk("id"),
  sectionKey: varchar("section_key", { length: 50 }).notNull().unique(),
  sectionType: hrSectionTypeEnum("section_type").notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  path: varchar("path", { length: 255 }).notNull(),
  requiredPermissions: text("required_permissions"), // JSON array
  minimumRole: varchar("minimum_role", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
});
