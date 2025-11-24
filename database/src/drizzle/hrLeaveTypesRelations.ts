import { relations } from "drizzle-orm";
import { hrLeaveTypes } from "./hrLeaveTypes.js";
import { hrLeaveRequests } from "./hrLeaveRequests.js";
import { hrLeaveAllocations } from "./hrLeaveAllocations.js";
import { organizations } from "./organizations.js";

export const hrLeaveTypesRelations = relations(hrLeaveTypes, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hrLeaveTypes.organizationId],
    references: [organizations.id],
  }),

  leaveRequests: many(hrLeaveRequests),
  allocations: many(hrLeaveAllocations),
}));
