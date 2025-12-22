/**
 * Zod validation schemas for Odoo accounting API responses
 */

import { z } from "zod";

// Odoo's many2one field format: [id, "Display Name"] or just id
const odooMany2OneSchema = z.union([
  z.tuple([z.number(), z.string()]),
  z.number(),
  z.null(),
  z.literal(false),
]);

// Odoo's one2many/many2many field format: array of IDs
const odooRelationIdsSchema = z.array(z.number());

// Account Read Response
export const odooAccountReadSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  account_type: z.string(),
  currency_id: odooMany2OneSchema.optional(),
  company_id: odooMany2OneSchema,
  group_id: odooMany2OneSchema.optional(),
  deprecated: z.boolean().optional(),
});

// Invoice Read Response (what we get from Odoo)
export const odooInvoiceReadSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  move_type: z.enum(["out_invoice", "out_refund", "in_invoice", "in_refund", "entry"]),
  partner_id: odooMany2OneSchema,
  invoice_date: z.string().optional(),
  invoice_date_due: z.string().optional(),
  payment_reference: z.string().optional(),
  currency_id: odooMany2OneSchema.optional(),
  invoice_line_ids: odooRelationIdsSchema.optional(), // Array of IDs when reading
  state: z.enum(["draft", "posted", "cancel"]).optional(),
  amount_untaxed: z.number().optional(),
  amount_tax: z.number().optional(),
  amount_total: z.number().optional(),
  amount_residual: z.number().optional(),
  payment_state: z.enum(["not_paid", "in_payment", "paid", "partial", "reversed"]).optional(),
  journal_id: odooMany2OneSchema.optional(),
  company_id: odooMany2OneSchema.optional(),
  invoice_origin: z.string().optional(),
  narration: z.string().optional(),
});

// Invoice Line Read Response
export const odooInvoiceLineReadSchema = z.object({
  id: z.number().optional(),
  product_id: odooMany2OneSchema.optional(),
  name: z.string(),
  quantity: z.number(),
  price_unit: z.number(),
  discount: z.number().optional(),
  tax_ids: odooRelationIdsSchema.optional(),
  account_id: odooMany2OneSchema.optional(),
  analytic_distribution: z.record(z.string(), z.number()).optional(),
});

// Payment Read Response
export const odooPaymentReadSchema = z.object({
  id: z.number().optional(),
  payment_type: z.enum(["inbound", "outbound", "transfer"]),
  partner_type: z.enum(["customer", "supplier"]),
  partner_id: odooMany2OneSchema,
  amount: z.number(),
  currency_id: odooMany2OneSchema,
  payment_date: z.string(),
  journal_id: odooMany2OneSchema,
  payment_method_id: odooMany2OneSchema.optional(),
  ref: z.string().optional(),
  state: z.enum(["draft", "posted", "sent", "reconciled", "cancelled"]).optional(),
  destination_account_id: odooMany2OneSchema.optional(),
});

// Partner Read Response
export const odooPartnerReadSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  vat: z.string().optional(),
  property_account_receivable_id: odooMany2OneSchema.optional(),
  property_account_payable_id: odooMany2OneSchema.optional(),
  property_payment_term_id: odooMany2OneSchema.optional(),
  customer_rank: z.number().optional(),
  supplier_rank: z.number().optional(),
});

// Journal Read Response
export const odooJournalReadSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  type: z.enum(["sale", "purchase", "cash", "bank", "general"]),
  currency_id: odooMany2OneSchema.optional(),
  company_id: odooMany2OneSchema,
  default_account_id: odooMany2OneSchema,
});

// Tax Read Response
export const odooTaxReadSchema = z.object({
  id: z.number(),
  name: z.string(),
  amount: z.number(),
  amount_type: z.enum(["percent", "division", "fixed", "group"]),
  type_tax_use: z.enum(["sale", "purchase", "none"]),
  active: z.boolean(),
});

// GL Entry Read Response
export const odooGLEntryReadSchema = z.object({
  id: z.number(),
  move_id: odooMany2OneSchema,
  date: z.string(),
  account_id: odooMany2OneSchema,
  partner_id: odooMany2OneSchema.optional(),
  name: z.string(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
  amount_currency: z.number().optional(),
  currency_id: odooMany2OneSchema.optional(),
  company_id: odooMany2OneSchema,
});

// Inferred types
export type OdooInvoiceRead = z.infer<typeof odooInvoiceReadSchema>;
export type OdooInvoiceLineRead = z.infer<typeof odooInvoiceLineReadSchema>;
export type OdooPaymentRead = z.infer<typeof odooPaymentReadSchema>;
export type OdooPartnerRead = z.infer<typeof odooPartnerReadSchema>;
export type OdooJournalRead = z.infer<typeof odooJournalReadSchema>;
export type OdooTaxRead = z.infer<typeof odooTaxReadSchema>;
export type OdooGLEntryRead = z.infer<typeof odooGLEntryReadSchema>;
