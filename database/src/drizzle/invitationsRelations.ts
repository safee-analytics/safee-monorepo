import { relations } from "drizzle-orm";
import { invitations } from "./invitations.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const invitationsRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));
