import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { organizations } from "./organizations.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
