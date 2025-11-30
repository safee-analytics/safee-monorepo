CREATE TYPE "audit"."plan_status" AS ENUM('draft', 'in_review', 'approved', 'converted', 'archived');
CREATE TYPE "audit"."plan_type" AS ENUM('standalone', 'case_integrated');
CREATE TYPE "audit"."report_status" AS ENUM('generating', 'ready', 'failed');
CREATE TABLE "audit"."audit_plans" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid,
	"plan_type" "audit"."plan_type" DEFAULT 'standalone' NOT NULL,
	"title" varchar(500) NOT NULL,
	"client_name" varchar(255),
	"audit_type" "audit"."audit_type",
	"audit_year" integer,
	"start_date" date,
	"target_completion" date,
	"objectives" jsonb DEFAULT '[]'::jsonb,
	"business_units" jsonb DEFAULT '{}'::jsonb,
	"financial_areas" jsonb DEFAULT '{}'::jsonb,
	"team_members" jsonb DEFAULT '[]'::jsonb,
	"phase_breakdown" jsonb DEFAULT '[]'::jsonb,
	"total_budget" numeric(15, 2),
	"total_hours" integer,
	"materiality_threshold" numeric(15, 2),
	"risk_assessment" jsonb,
	"status" "audit"."plan_status" DEFAULT 'draft' NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "audit"."audit_plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"audit_type" "audit"."audit_type",
	"description" text,
	"default_objectives" jsonb DEFAULT '[]'::jsonb,
	"default_scope" jsonb DEFAULT '{}'::jsonb,
	"default_phases" jsonb DEFAULT '[]'::jsonb,
	"default_business_units" jsonb DEFAULT '{}'::jsonb,
	"default_financial_areas" jsonb DEFAULT '{}'::jsonb,
	"estimated_duration" integer,
	"estimated_hours" integer,
	"estimated_budget" numeric(15, 2),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit"."audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"template_id" uuid,
	"title" varchar(500) NOT NULL,
	"status" "audit"."report_status" DEFAULT 'generating' NOT NULL,
	"generated_data" jsonb,
	"settings" jsonb,
	"file_path" text,
	"generated_at" timestamp with time zone,
	"generated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit"."audit_report_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"audit_type" "audit"."audit_type",
	"description" text,
	"template_structure" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "sales"."stages" RENAME COLUMN "fold_stage" TO "fold";
ALTER TABLE "sales"."stages" RENAME COLUMN "team_id" TO "team_ids";
ALTER TABLE "sales"."leads" ADD COLUMN "partner_name" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "website" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "function" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "street" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "street2" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "city" varchar(100);
ALTER TABLE "sales"."leads" ADD COLUMN "state_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "country_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "zip" varchar(20);
ALTER TABLE "sales"."leads" ADD COLUMN "commercial_partner_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "company_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "campaign_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "source_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "medium_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "lang_id" integer;
ALTER TABLE "sales"."leads" ADD COLUMN "prorated_revenue" numeric(15, 2);
ALTER TABLE "sales"."leads" ADD COLUMN "recurring_revenue_monthly" numeric(15, 2);
ALTER TABLE "sales"."leads" ADD COLUMN "probability" numeric(5, 2);
ALTER TABLE "sales"."leads" ADD COLUMN "date_conversion" timestamp with time zone;
ALTER TABLE "sales"."leads" ADD COLUMN "date_last_stage_update" timestamp with time zone;
ALTER TABLE "sales"."leads" ADD COLUMN "referred" varchar(255);
ALTER TABLE "sales"."leads" ADD COLUMN "color" integer;
ALTER TABLE "sales"."stages" ADD COLUMN "rotting_threshold_days" integer;
ALTER TABLE "sales"."stages" ADD COLUMN "requirements" text;
ALTER TABLE "sales"."stages" ADD COLUMN "color" integer;
ALTER TABLE "sales"."contacts" ADD COLUMN "company_type" varchar(20);
ALTER TABLE "sales"."contacts" ADD COLUMN "phone_mobile_search" varchar(50);
ALTER TABLE "sales"."contacts" ADD COLUMN "function" varchar(255);
ALTER TABLE "sales"."contacts" ADD COLUMN "comment" text;
ALTER TABLE "audit"."audit_plans" ADD CONSTRAINT "audit_plans_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."audit_plans" ADD CONSTRAINT "audit_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_plans" ADD CONSTRAINT "audit_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_plan_templates" ADD CONSTRAINT "audit_plan_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_reports" ADD CONSTRAINT "audit_reports_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_reports" ADD CONSTRAINT "audit_reports_template_id_audit_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "audit"."audit_report_templates"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_reports" ADD CONSTRAINT "audit_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_report_templates" ADD CONSTRAINT "audit_report_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "audit_plans_case_id_idx" ON "audit"."audit_plans" USING btree ("case_id");
CREATE INDEX "audit_plans_status_idx" ON "audit"."audit_plans" USING btree ("status");
CREATE INDEX "audit_plans_created_by_idx" ON "audit"."audit_plans" USING btree ("created_by");
CREATE INDEX "audit_plans_audit_type_idx" ON "audit"."audit_plans" USING btree ("audit_type");
CREATE INDEX "audit_plans_org_idx" ON "audit"."audit_plans" USING btree ("organization_id");
CREATE INDEX "audit_plan_templates_audit_type_idx" ON "audit"."audit_plan_templates" USING btree ("audit_type");
CREATE INDEX "audit_plan_templates_active_idx" ON "audit"."audit_plan_templates" USING btree ("is_active");
CREATE INDEX "audit_plan_templates_org_idx" ON "audit"."audit_plan_templates" USING btree ("organization_id");
CREATE INDEX "audit_reports_case_id_idx" ON "audit"."audit_reports" USING btree ("case_id");
CREATE INDEX "audit_reports_status_idx" ON "audit"."audit_reports" USING btree ("status");
CREATE INDEX "audit_reports_generated_by_idx" ON "audit"."audit_reports" USING btree ("generated_by");
CREATE INDEX "audit_report_templates_audit_type_idx" ON "audit"."audit_report_templates" USING btree ("audit_type");
CREATE INDEX "audit_report_templates_active_idx" ON "audit"."audit_report_templates" USING btree ("is_active");
CREATE INDEX "audit_report_templates_org_idx" ON "audit"."audit_report_templates" USING btree ("organization_id");
ALTER TABLE "sales"."contacts" DROP COLUMN "mobile";