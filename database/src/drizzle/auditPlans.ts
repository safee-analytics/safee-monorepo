import { uuid, varchar, timestamp, jsonb, index, integer, decimal, date } from "drizzle-orm/pg-core";
import { auditSchema, idpk, auditTypeEnum } from "./_common.js";
import { cases } from "./cases.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const planTypeEnum = auditSchema.enum("plan_type", ["standalone", "case_integrated"]);
export const planStatusEnum = auditSchema.enum("plan_status", [
  "draft",
  "in_review",
  "approved",
  "converted",
  "archived",
]);

export const auditPlans = auditSchema.table(
  "audit_plans",
  {
    id: idpk("id"),
    caseId: uuid("case_id").references(() => cases.id, { onDelete: "set null" }),
    planType: planTypeEnum("plan_type").notNull().default("standalone"),
    title: varchar("title", { length: 500 }).notNull(),
    clientName: varchar("client_name", { length: 255 }),
    auditType: auditTypeEnum("audit_type"),
    auditYear: integer("audit_year"),
    startDate: date("start_date"),
    targetCompletion: date("target_completion"),
    objectives: jsonb("objectives")
      .default([])
      .$type<{ id: string; description: string; priority?: string }[]>(),
    businessUnits: jsonb("business_units").default({}).$type<Record<string, boolean>>(),
    financialAreas: jsonb("financial_areas").default({}).$type<Record<string, boolean>>(),
    teamMembers: jsonb("team_members")
      .default([])
      .$type<{ userId: string; name: string; role: string; hours?: number }[]>(),
    phaseBreakdown: jsonb("phase_breakdown")
      .default([])
      .$type<
        { name: string; duration: number; description?: string; startDate?: string; endDate?: string }[]
      >(),
    totalBudget: decimal("total_budget", { precision: 15, scale: 2 }),
    totalHours: integer("total_hours"),
    materialityThreshold: decimal("materiality_threshold", { precision: 15, scale: 2 }),
    riskAssessment: jsonb("risk_assessment").$type<{
      risks?: { type: string; severity: string; message: string }[];
      overallRisk?: string;
      score?: number;
    }>(),
    status: planStatusEnum("status").notNull().default("draft"),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "restrict", onUpdate: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("audit_plans_case_id_idx").on(table.caseId),
    index("audit_plans_status_idx").on(table.status),
    index("audit_plans_created_by_idx").on(table.createdBy),
    index("audit_plans_audit_type_idx").on(table.auditType),
    index("audit_plans_org_idx").on(table.organizationId),
  ],
);

export type AuditPlan = typeof auditPlans.$inferSelect;
export type NewAuditPlan = typeof auditPlans.$inferInsert;
