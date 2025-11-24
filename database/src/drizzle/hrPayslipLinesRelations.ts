import { relations } from "drizzle-orm";
import { hrPayslipLines } from "./hrPayslipLines.js";
import { hrPayslips } from "./hrPayslips.js";

export const hrPayslipLinesRelations = relations(hrPayslipLines, ({ one }) => ({
  payslip: one(hrPayslips, {
    fields: [hrPayslipLines.payslipId],
    references: [hrPayslips.id],
  }),
}));
