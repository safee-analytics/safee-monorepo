import { relations } from "drizzle-orm";
import { odooIdempotencyKeys } from "./odooIdempotencyKeys.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const odooIdempotencyKeysRelations = relations(odooIdempotencyKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [odooIdempotencyKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [odooIdempotencyKeys.userId],
    references: [users.id],
  }),
}));
