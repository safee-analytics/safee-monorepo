import { z } from "zod";
import { BadRequest, Forbidden } from "../../errors.js";

/**
 * Validation schemas for Odoo operations
 */

export const OdooModelSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_.]+$/);

export const OdooFieldNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_]+$/);

export const OdooExternalIdSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9_.-]+$/);

export const OdooMethodNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_]+$/);

export const OdooDomainOperatorSchema = z.enum([
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "like",
  "ilike",
  "=like",
  "=ilike",
  "not like",
  "not ilike",
  "in",
  "not in",
  "child_of",
  "parent_of",
]);

export const OdooDomainLeafSchema = z.tuple([
  OdooFieldNameSchema,
  OdooDomainOperatorSchema,
  z.union([z.string(), z.number(), z.boolean(), z.array(z.union([z.string(), z.number()]))]),
]);

export const OdooDomainSchema = z.array(
  z.union([OdooDomainLeafSchema, z.literal("&"), z.literal("|"), z.literal("!")]),
);

export const OdooRecordIdSchema = z.number().int().positive();

export const OdooLimitSchema = z.number().int().min(1).max(10000);

export const OdooOffsetSchema = z.number().int().min(0);

export const OdooOrderSchema = z
  .string()
  .max(200)
  .regex(/^[a-z0-9_, ]+$/i);

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeError(error: unknown): Error {
  if (error instanceof Error) {
    // Remove sensitive information from error messages
    const sanitizedMessage = error.message
      .replace(/password[=:]\s*[^\s,;]+/gi, "password=***")
      .replace(/key[=:]\s*[^\s,;]+/gi, "key=***")
      .replace(/token[=:]\s*[^\s,;]+/gi, "token=***")
      .replace(/secret[=:]\s*[^\s,;]+/gi, "secret=***")
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "***")
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "***@***.***");

    return new Error(sanitizedMessage);
  }

  return new Error("An error occurred during Odoo operation");
}

/**
 * Validate model name
 */
export function validateModel(model: string): string {
  const result = OdooModelSchema.safeParse(model);
  if (!result.success) {
    throw new BadRequest(`Invalid model name: ${model}`);
  }
  return result.data;
}

/**
 * Validate field names
 */
export function validateFields(fields: string[]): string[] {
  const validated = fields.map((field) => {
    const result = OdooFieldNameSchema.safeParse(field);
    if (!result.success) {
      throw new BadRequest(`Invalid field name: ${field}`);
    }
    return result.data;
  });
  return validated;
}

/**
 * Validate record IDs
 */
export function validateIds(ids: number[]): number[] {
  const validated = ids.map((id) => {
    const result = OdooRecordIdSchema.safeParse(id);
    if (!result.success) {
      throw new BadRequest(`Invalid record ID: ${id}`);
    }
    return result.data;
  });
  return validated;
}

/**
 * Validate domain (basic validation - can be enhanced)
 */
export function validateDomain(domain: unknown[]): unknown[] {
  // Basic validation - ensure it's an array
  if (!Array.isArray(domain)) {
    throw new BadRequest("Domain must be an array");
  }

  // Validate each leaf
  for (const item of domain) {
    if (Array.isArray(item) && item.length === 3) {
      // Validate domain leaf [field, operator, value]
      const result = OdooDomainLeafSchema.safeParse(item);
      if (!result.success) {
        throw new BadRequest(`Invalid domain leaf: ${JSON.stringify(item)}`);
      }
    } else if (typeof item === "string" && !["&", "|", "!"].includes(item)) {
      throw new BadRequest(`Invalid domain operator: ${item}`);
    }
  }

  return domain;
}

/**
 * Validate method name to prevent method injection
 */
export function validateMethod(method: string): string {
  const result = OdooMethodNameSchema.safeParse(method);
  if (!result.success) {
    throw new BadRequest(`Invalid method name: ${method}`);
  }

  // Blacklist dangerous methods
  const dangerousMethods = ["unlink_all", "drop_table", "execute", "sql_query", "__import__", "eval", "exec"];

  if (dangerousMethods.includes(method.toLowerCase())) {
    throw new Forbidden(`Method not allowed: ${method}`);
  }

  return result.data;
}

/**
 * Validate limit parameter
 */
export function validateLimit(limit?: number): number | undefined {
  if (limit === undefined) return undefined;

  const result = OdooLimitSchema.safeParse(limit);
  if (!result.success) {
    throw new BadRequest(`Invalid limit: ${limit}. Must be between 1 and 10000`);
  }
  return result.data;
}

/**
 * Validate offset parameter
 */
export function validateOffset(offset?: number): number | undefined {
  if (offset === undefined) return undefined;

  const result = OdooOffsetSchema.safeParse(offset);
  if (!result.success) {
    throw new BadRequest(`Invalid offset: ${offset}. Must be >= 0`);
  }
  return result.data;
}

/**
 * Validate order parameter
 */
export function validateOrder(order?: string): string | undefined {
  if (!order) return undefined;

  const result = OdooOrderSchema.safeParse(order);
  if (!result.success) {
    throw new BadRequest(`Invalid order clause: ${order}`);
  }
  return result.data;
}

/**
 * Sanitize values object to prevent injection
 */
export function sanitizeValues(values: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    // Validate field name
    const result = OdooFieldNameSchema.safeParse(key);
    if (!result.success) {
      throw new BadRequest(`Invalid field name in values: ${key}`);
    }

    // Basic type validation
    if (typeof value === "function") {
      throw new BadRequest(`Functions not allowed in values`);
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Validate external ID
 */
export function validateExternalId(externalId: string): string {
  const result = OdooExternalIdSchema.safeParse(externalId);
  if (!result.success) {
    throw new BadRequest(`Invalid external ID: ${externalId}`);
  }
  return result.data;
}
