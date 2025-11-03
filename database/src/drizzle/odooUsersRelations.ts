import { relations } from "drizzle-orm";
import { odooUsers } from "./odooUsers.js";
import { users } from "./users.js";
import { odooDatabases } from "./odooDatabases.js";

export const odooUsersRelations = relations(odooUsers, ({ one }) => ({
  user: one(users, {
    fields: [odooUsers.userId],
    references: [users.id],
  }),
  odooDatabase: one(odooDatabases, {
    fields: [odooUsers.odooDatabaseId],
    references: [odooDatabases.id],
  }),
}));
