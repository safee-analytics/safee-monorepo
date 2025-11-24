import { relations } from "drizzle-orm";
import { hrPayslips } from "./hrPayslips.js";
import { hrPayslipLines } from "./hrPayslipLines.js";
import { hrEmployees } from "./hrEmployees.js";
import { hrContracts } from "./hrContracts.js";
import { organizations } from "./organizations.js";

export const hrPayslipsRelations = relations(hrPayslips, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [hrPayslips.organizationId],
    references: [organizations.id],
  }),
  employee: one(hrEmployees, {
    fields: [hrPayslips.employeeId],
    references: [hrEmployees.id],
  }),
  contract: one(hrContracts, {
    fields: [hrPayslips.contractId],
    references: [hrContracts.id],
  }),

  lines: many(hrPayslipLines),
}));
