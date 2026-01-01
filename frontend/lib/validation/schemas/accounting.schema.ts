import { z } from "zod";

export const invoiceStatusSchema = z.enum(["draft", "posted", "cancel"]);
export const invoiceTypeSchema = z.enum(["SALES", "PURCHASE"]);

export const invoiceSchema = z.object({
  id: z.string(),
  number: z.string().optional(),
  type: invoiceTypeSchema,
  date: z.string(),
  total: z.number(),
  status: invoiceStatusSchema,
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
export type InvoiceType = z.infer<typeof invoiceTypeSchema>;
