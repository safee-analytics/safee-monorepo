import { relations } from "drizzle-orm";
import { odooAuditLogs } from "./odooAuditLogs.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const odooAuditLogsRelations = relations(odooAuditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [odooAuditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [odooAuditLogs.userId],
    references: [users.id],
  }),
}));
