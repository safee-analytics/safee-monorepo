import { uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { organizations } from "./organizations.js";

export const teams = identitySchema.table(
  "teams",
  {
    id: idpk("id"),
    name: varchar("name", { length: 255 }).notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("teams_organization_id_idx").on(table.organizationId),
    index("teams_name_idx").on(table.name),
  ],
);
