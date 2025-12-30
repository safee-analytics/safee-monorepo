import { z } from "zod";

/**
 * Shared Zod schemas for Odoo API responses
 * Used across all Odoo service files for type-safe API interactions
 */

export const odooErrorSchema = z.object({
  code: z.number().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export const odooApiResponseSchema = z.object({
  error: z.union([odooErrorSchema, z.string()]).optional(),
  result: z.unknown().optional(),
});

export const odooAuthResponseSchema = z.object({
  error: odooErrorSchema.optional(),
  result: z
    .object({
      uid: z.number(),
      session_id: z.string().optional(), // Odoo 18: session_id moved to cookies, not in JSON response
    })
    .optional(),
});

export const odooApiKeyResultSchema = z.object({
  ok: z.boolean(),
  id: z.number().optional(),
  token: z.string().optional(),
  error: z.string().optional(),
});

export type OdooError = z.infer<typeof odooErrorSchema>;
export type OdooApiResponse<T = unknown> = {
  error?: OdooError | string;
  result?: T;
};
