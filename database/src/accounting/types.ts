import type { accountingInvoices, accountingPayments } from "../drizzle/index.js";

export type Invoice = typeof accountingInvoices.$inferSelect;
export type CreateInvoiceInput = typeof accountingInvoices.$inferInsert;
export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "id" | "organizationId" | "odooInvoiceId">>;

export type Payment = typeof accountingPayments.$inferSelect;
export type CreatePaymentInput = typeof accountingPayments.$inferInsert;
export type UpdatePaymentInput = Partial<Omit<CreatePaymentInput, "id" | "organizationId" | "odooPaymentId">>;
