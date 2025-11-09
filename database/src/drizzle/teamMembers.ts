import { uuid, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { teams } from "./teams.js";
import { users } from "./users.js";
import { sql } from "drizzle-orm";

export const teamMembers = identitySchema.table(
  "team_members",
  {
    id: uuid("id")
      .default(sql`uuid_generate_v4()`)
      .notNull(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.userId] }),
    index("team_members_team_id_idx").on(table.teamId),
    index("team_members_user_id_idx").on(table.userId),
  ],
);
