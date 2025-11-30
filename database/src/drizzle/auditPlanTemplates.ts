import { uuid, varchar, timestamp, text, jsonb, index, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { auditSchema, idpk, auditTypeEnum } from "./_common.js";
import { organizations } from "./organizations.js";

export const auditPlanTemplates = auditSchema.table(
  "audit_plan_templates",
  {
    id: idpk("id"),
    name: varchar("name", { length: 255 }).notNull(),
    auditType: auditTypeEnum("audit_type"),
    description: text("description"),
    defaultObjectives: jsonb("default_objectives")
      .default([])
      .$type<{ id: string; description: string; priority?: string }[]>(),
    defaultScope: jsonb("default_scope").default({}).$type<Record<string, unknown>>(),
    defaultPhases: jsonb("default_phases")
      .default([])
      .$type<{ name: string; duration: number; description?: string }[]>(),
    defaultBusinessUnits: jsonb("default_business_units").default({}).$type<Record<string, boolean>>(),
    defaultFinancialAreas: jsonb("default_financial_areas").default({}).$type<Record<string, boolean>>(),
    estimatedDuration: integer("estimated_duration"),
    estimatedHours: integer("estimated_hours"),
    estimatedBudget: decimal("estimated_budget", { precision: 15, scale: 2 }),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_plan_templates_audit_type_idx").on(table.auditType),
    index("audit_plan_templates_active_idx").on(table.isActive),
    index("audit_plan_templates_org_idx").on(table.organizationId),
  ],
);

export type AuditPlanTemplate = typeof auditPlanTemplates.$inferSelect;
export type NewAuditPlanTemplate = typeof auditPlanTemplates.$inferInsert;
