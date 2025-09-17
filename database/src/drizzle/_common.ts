import { pgSchema, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

// Define PostgreSQL schemas for the Safee Analytics modular monolith
export const identitySchema = pgSchema("identity");
export const financeSchema = pgSchema("finance");
export const hrSchema = pgSchema("hr");
export const salesSchema = pgSchema("sales");
export const systemSchema = pgSchema("system");

// Export all schemas for easy importing
export const schemas = {
  identity: identitySchema,
  finance: financeSchema,
  hr: hrSchema,
  sales: salesSchema,
  system: systemSchema,
} as const;
