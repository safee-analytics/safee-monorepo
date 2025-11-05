import { uuid, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";
import { sql } from "drizzle-orm";

export const members = identitySchema.table(
  "members",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: varchar("role", { length: 50 }).default("member").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.userId] })],
);
