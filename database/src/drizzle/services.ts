import { varchar, timestamp, boolean, text } from "drizzle-orm/pg-core";
import { systemSchema, idpk, serviceTypeEnum } from "./_common.js";

export const services = systemSchema.table("services", {
  id: idpk("id"),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  serviceType: serviceTypeEnum("service_type").notNull(),
  icon: varchar("icon", { length: 100 }), // Icon identifier
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: varchar("sort_order", { length: 10 }).default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
