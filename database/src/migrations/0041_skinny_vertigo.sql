CREATE SCHEMA "cases";

CREATE TYPE "cases"."assignment_role" AS ENUM('lead', 'reviewer', 'team_member');
CREATE TYPE "cases"."case_action" AS ENUM('created', 'updated', 'deleted', 'completed', 'archived', 'assigned', 'unassigned');
CREATE TYPE "cases"."case_category" AS ENUM('certification', 'financial', 'operational', 'compliance');
CREATE TYPE "cases"."case_entity_type" AS ENUM('case', 'scope', 'section', 'procedure', 'document', 'note');
CREATE TYPE "cases"."case_priority" AS ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE "cases"."case_status" AS ENUM('draft', 'in_progress', 'under_review', 'completed', 'overdue', 'archived');
CREATE TYPE "cases"."case_type" AS ENUM('ICV_AUDIT', 'ISO_9001_AUDIT', 'ISO_14001_AUDIT', 'ISO_45001_AUDIT', 'FINANCIAL_AUDIT', 'INTERNAL_AUDIT', 'COMPLIANCE_AUDIT', 'OPERATIONAL_AUDIT');
CREATE TYPE "cases"."note_type" AS ENUM('observation', 'review_comment', 'general', 'memo');
CREATE TYPE "cases"."step_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped', 'blocked');
CREATE TYPE "cases"."step_type" AS ENUM('form_input', 'document_upload', 'document_collection', 'scope_editor', 'calculation_review', 'approval_stage', 'review_stage', 'checklist', 'report_generation', 'custom');
CREATE TYPE "cases"."template_status" AS ENUM('draft', 'in_progress', 'under_review', 'completed', 'archived');
CREATE TYPE "cases"."template_type" AS ENUM('scope', 'form', 'checklist', 'report', 'plan');
CREATE TYPE "cases"."plan_status" AS ENUM('draft', 'in_review', 'approved', 'converted', 'archived');
CREATE TYPE "cases"."plan_type" AS ENUM('standalone', 'case_integrated');
CREATE TYPE "cases"."report_status" AS ENUM('generating', 'ready', 'failed');
CREATE TYPE "cases"."activity_type" AS ENUM('case_created', 'status_changed', 'priority_updated', 'document_uploaded', 'document_approved', 'document_rejected', 'comment_added', 'team_member_assigned', 'team_member_removed', 'case_completed', 'case_archived', 'scope_created', 'procedure_completed', 'plan_created', 'report_generated');
CREATE TABLE "cases"."cases" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"case_type" "cases"."case_type" NOT NULL,
	"status" "cases"."case_status" DEFAULT 'draft' NOT NULL,
	"priority" "cases"."case_priority" DEFAULT 'medium' NOT NULL,
	"workflow_template_id" uuid,
	"due_date" date,
	"completed_date" date,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_org_case_number_unique" UNIQUE("organization_id","case_number")
);

CREATE TABLE "cases"."templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"template_type" "cases"."template_type" NOT NULL,
	"category" "cases"."case_category",
	"version" varchar(50) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system_template" boolean DEFAULT false NOT NULL,
	"structure" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."template_instances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"template_id" uuid,
	"step_execution_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "cases"."template_status" DEFAULT 'draft' NOT NULL,
	"data" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"completed_by" uuid,
	"archived_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);

CREATE TABLE "cases"."workflow_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"case_type" "cases"."case_type" NOT NULL,
	"version" varchar(50) DEFAULT '1.0' NOT NULL,
	"is_system_template" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"workflow_template_id" uuid NOT NULL,
	"step_id" varchar(100) NOT NULL,
	"step_order" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"step_type" "cases"."step_type" NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"conditions" jsonb DEFAULT '[]'::jsonb,
	"is_required" boolean DEFAULT true NOT NULL,
	"can_skip" boolean DEFAULT false NOT NULL,
	"approval_workflow_id" uuid,
	"template_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_steps_template_step_unique" UNIQUE("workflow_template_id","step_id")
);

CREATE TABLE "cases"."workflow_instances" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"workflow_template_id" uuid NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"current_step_id" varchar(100),
	"state" jsonb DEFAULT '{"completedSteps":[],"stepData":{},"variables":{}}'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "workflow_instances_case_id_unique" UNIQUE("case_id")
);

CREATE TABLE "cases"."step_executions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"workflow_instance_id" uuid NOT NULL,
	"workflow_step_id" uuid,
	"step_id" varchar(100) NOT NULL,
	"status" "cases"."step_status" DEFAULT 'pending' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"approval_request_id" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "step_executions_case_step_unique" UNIQUE("case_id","step_id")
);

CREATE TABLE "cases"."audit_sections" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"scope_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."audit_procedures" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"section_id" uuid NOT NULL,
	"reference_number" varchar(50) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"requirements" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_by" uuid,
	"completed_at" timestamp with time zone,
	"memo" text,
	"field_data" jsonb DEFAULT '{}'::jsonb,
	"can_edit" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."audit_plans" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid,
	"plan_type" "cases"."plan_type" DEFAULT 'standalone' NOT NULL,
	"title" varchar(500) NOT NULL,
	"client_name" varchar(255),
	"case_type" "cases"."case_type",
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
	"status" "cases"."plan_status" DEFAULT 'draft' NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);

CREATE TABLE "cases"."audit_plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"case_type" "cases"."case_type",
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

CREATE TABLE "cases"."case_documents" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"procedure_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"file_type" varchar(100) NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_document_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"ocr_text" text,
	"ocr_processed_at" timestamp with time zone
);

CREATE TABLE "cases"."case_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"procedure_id" uuid,
	"note_type" "cases"."note_type" NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL
);

CREATE TABLE "cases"."case_assignments" (
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "cases"."assignment_role" NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_assignments_case_id_user_id_pk" PRIMARY KEY("case_id","user_id")
);

CREATE TABLE "cases"."case_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"entity_type" "cases"."case_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "cases"."case_action" NOT NULL,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."audit_reports" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"template_id" uuid,
	"title" varchar(500) NOT NULL,
	"status" "cases"."report_status" DEFAULT 'generating' NOT NULL,
	"generated_data" jsonb,
	"settings" jsonb,
	"file_path" text,
	"generated_at" timestamp with time zone,
	"generated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."audit_report_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"case_type" "cases"."case_type",
	"description" text,
	"template_structure" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."case_activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"activity_type" "cases"."activity_type" NOT NULL,
	"user_id" uuid,
	"metadata" jsonb,
	"is_read" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "cases"."case_presence" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

DROP TABLE "audit"."cases" CASCADE;
DROP TABLE "audit"."audit_templates" CASCADE;
DROP TABLE "audit"."audit_scopes" CASCADE;
DROP TABLE "audit"."audit_sections" CASCADE;
DROP TABLE "audit"."audit_procedures" CASCADE;
DROP TABLE "audit"."audit_plans" CASCADE;
DROP TABLE "audit"."audit_plan_templates" CASCADE;
DROP TABLE "audit"."case_documents" CASCADE;
DROP TABLE "audit"."case_notes" CASCADE;
DROP TABLE "audit"."case_assignments" CASCADE;
DROP TABLE "audit"."case_history" CASCADE;
DROP TABLE "audit"."audit_reports" CASCADE;
DROP TABLE "audit"."audit_report_templates" CASCADE;
DROP TABLE "audit"."case_activities" CASCADE;
DROP TABLE "audit"."case_presence" CASCADE;
ALTER TABLE "cases"."cases" ADD CONSTRAINT "cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."cases" ADD CONSTRAINT "cases_workflow_template_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_template_id") REFERENCES "cases"."workflow_templates"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "cases"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."templates" ADD CONSTRAINT "templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."templates" ADD CONSTRAINT "templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."template_instances" ADD CONSTRAINT "template_instances_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."template_instances" ADD CONSTRAINT "template_instances_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "cases"."templates"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."template_instances" ADD CONSTRAINT "template_instances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."template_instances" ADD CONSTRAINT "template_instances_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."template_instances" ADD CONSTRAINT "template_instances_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."workflow_templates" ADD CONSTRAINT "workflow_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."workflow_templates" ADD CONSTRAINT "workflow_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_template_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_template_id") REFERENCES "cases"."workflow_templates"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."workflow_steps" ADD CONSTRAINT "workflow_steps_approval_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("approval_workflow_id") REFERENCES "system"."approval_workflows"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."workflow_steps" ADD CONSTRAINT "workflow_steps_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "cases"."templates"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."workflow_instances" ADD CONSTRAINT "workflow_instances_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_template_id_workflow_templates_id_fk" FOREIGN KEY ("workflow_template_id") REFERENCES "cases"."workflow_templates"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "cases"."step_executions" ADD CONSTRAINT "step_executions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."step_executions" ADD CONSTRAINT "step_executions_workflow_instance_id_workflow_instances_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "cases"."workflow_instances"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."step_executions" ADD CONSTRAINT "step_executions_workflow_step_id_workflow_steps_id_fk" FOREIGN KEY ("workflow_step_id") REFERENCES "cases"."workflow_steps"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "cases"."step_executions" ADD CONSTRAINT "step_executions_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "system"."approval_requests"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."step_executions" ADD CONSTRAINT "step_executions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."audit_sections" ADD CONSTRAINT "audit_sections_scope_id_template_instances_id_fk" FOREIGN KEY ("scope_id") REFERENCES "cases"."template_instances"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."audit_procedures" ADD CONSTRAINT "audit_procedures_section_id_audit_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "cases"."audit_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."audit_procedures" ADD CONSTRAINT "audit_procedures_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."audit_plans" ADD CONSTRAINT "audit_plans_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."audit_plans" ADD CONSTRAINT "audit_plans_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."audit_plans" ADD CONSTRAINT "audit_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."audit_plan_templates" ADD CONSTRAINT "audit_plan_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_documents" ADD CONSTRAINT "case_documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_documents" ADD CONSTRAINT "case_documents_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "cases"."audit_procedures"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."case_documents" ADD CONSTRAINT "case_documents_parent_document_id_case_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "cases"."case_documents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."case_documents" ADD CONSTRAINT "case_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_notes" ADD CONSTRAINT "case_notes_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "cases"."audit_procedures"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_notes" ADD CONSTRAINT "case_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."case_assignments" ADD CONSTRAINT "case_assignments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_assignments" ADD CONSTRAINT "case_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_assignments" ADD CONSTRAINT "case_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."case_history" ADD CONSTRAINT "case_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_history" ADD CONSTRAINT "case_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."audit_reports" ADD CONSTRAINT "audit_reports_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."audit_reports" ADD CONSTRAINT "audit_reports_template_id_audit_report_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "cases"."audit_report_templates"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "cases"."audit_reports" ADD CONSTRAINT "audit_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "cases"."audit_report_templates" ADD CONSTRAINT "audit_report_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_activities" ADD CONSTRAINT "case_activities_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_activities" ADD CONSTRAINT "case_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "cases"."case_presence" ADD CONSTRAINT "case_presence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "cases"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "cases"."case_presence" ADD CONSTRAINT "case_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "cases_organization_id_idx" ON "cases"."cases" USING btree ("organization_id");
CREATE INDEX "cases_status_idx" ON "cases"."cases" USING btree ("status");
CREATE INDEX "cases_case_type_idx" ON "cases"."cases" USING btree ("case_type");
CREATE INDEX "cases_workflow_template_id_idx" ON "cases"."cases" USING btree ("workflow_template_id");
CREATE INDEX "cases_created_by_idx" ON "cases"."cases" USING btree ("created_by");
CREATE INDEX "templates_organization_id_idx" ON "cases"."templates" USING btree ("organization_id");
CREATE INDEX "templates_template_type_idx" ON "cases"."templates" USING btree ("template_type");
CREATE INDEX "templates_is_active_idx" ON "cases"."templates" USING btree ("is_active");
CREATE INDEX "templates_is_system_template_idx" ON "cases"."templates" USING btree ("is_system_template");
CREATE INDEX "template_instances_case_id_idx" ON "cases"."template_instances" USING btree ("case_id");
CREATE INDEX "template_instances_template_id_idx" ON "cases"."template_instances" USING btree ("template_id");
CREATE INDEX "template_instances_step_execution_id_idx" ON "cases"."template_instances" USING btree ("step_execution_id");
CREATE INDEX "template_instances_status_idx" ON "cases"."template_instances" USING btree ("status");
CREATE INDEX "workflow_templates_organization_id_idx" ON "cases"."workflow_templates" USING btree ("organization_id");
CREATE INDEX "workflow_templates_case_type_idx" ON "cases"."workflow_templates" USING btree ("case_type");
CREATE INDEX "workflow_templates_is_active_idx" ON "cases"."workflow_templates" USING btree ("is_active");
CREATE INDEX "workflow_templates_is_system_template_idx" ON "cases"."workflow_templates" USING btree ("is_system_template");
CREATE INDEX "workflow_steps_workflow_template_id_idx" ON "cases"."workflow_steps" USING btree ("workflow_template_id");
CREATE INDEX "workflow_steps_step_order_idx" ON "cases"."workflow_steps" USING btree ("step_order");
CREATE INDEX "workflow_steps_approval_workflow_id_idx" ON "cases"."workflow_steps" USING btree ("approval_workflow_id");
CREATE INDEX "workflow_instances_workflow_template_id_idx" ON "cases"."workflow_instances" USING btree ("workflow_template_id");
CREATE INDEX "workflow_instances_current_step_id_idx" ON "cases"."workflow_instances" USING btree ("current_step_id");
CREATE INDEX "step_executions_case_id_idx" ON "cases"."step_executions" USING btree ("case_id");
CREATE INDEX "step_executions_workflow_instance_id_idx" ON "cases"."step_executions" USING btree ("workflow_instance_id");
CREATE INDEX "step_executions_workflow_step_id_idx" ON "cases"."step_executions" USING btree ("workflow_step_id");
CREATE INDEX "step_executions_status_idx" ON "cases"."step_executions" USING btree ("status");
CREATE INDEX "step_executions_approval_request_id_idx" ON "cases"."step_executions" USING btree ("approval_request_id");
CREATE INDEX "audit_sections_scope_id_idx" ON "cases"."audit_sections" USING btree ("scope_id");
CREATE INDEX "audit_sections_sort_order_idx" ON "cases"."audit_sections" USING btree ("sort_order");
CREATE INDEX "audit_procedures_section_id_idx" ON "cases"."audit_procedures" USING btree ("section_id");
CREATE INDEX "audit_procedures_is_completed_idx" ON "cases"."audit_procedures" USING btree ("is_completed");
CREATE INDEX "audit_procedures_sort_order_idx" ON "cases"."audit_procedures" USING btree ("sort_order");
CREATE INDEX "audit_plans_case_id_idx" ON "cases"."audit_plans" USING btree ("case_id");
CREATE INDEX "audit_plans_status_idx" ON "cases"."audit_plans" USING btree ("status");
CREATE INDEX "audit_plans_created_by_idx" ON "cases"."audit_plans" USING btree ("created_by");
CREATE INDEX "audit_plans_case_type_idx" ON "cases"."audit_plans" USING btree ("case_type");
CREATE INDEX "audit_plans_org_idx" ON "cases"."audit_plans" USING btree ("organization_id");
CREATE INDEX "audit_plan_templates_case_type_idx" ON "cases"."audit_plan_templates" USING btree ("case_type");
CREATE INDEX "audit_plan_templates_active_idx" ON "cases"."audit_plan_templates" USING btree ("is_active");
CREATE INDEX "audit_plan_templates_org_idx" ON "cases"."audit_plan_templates" USING btree ("organization_id");
CREATE INDEX "case_documents_case_id_idx" ON "cases"."case_documents" USING btree ("case_id");
CREATE INDEX "case_documents_procedure_id_idx" ON "cases"."case_documents" USING btree ("procedure_id");
CREATE INDEX "case_documents_parent_document_id_idx" ON "cases"."case_documents" USING btree ("parent_document_id");
CREATE INDEX "case_documents_is_deleted_idx" ON "cases"."case_documents" USING btree ("is_deleted");
CREATE INDEX "case_notes_case_id_idx" ON "cases"."case_notes" USING btree ("case_id");
CREATE INDEX "case_notes_procedure_id_idx" ON "cases"."case_notes" USING btree ("procedure_id");
CREATE INDEX "case_notes_note_type_idx" ON "cases"."case_notes" USING btree ("note_type");
CREATE INDEX "case_notes_created_by_idx" ON "cases"."case_notes" USING btree ("created_by");
CREATE INDEX "case_assignments_user_id_idx" ON "cases"."case_assignments" USING btree ("user_id");
CREATE INDEX "case_assignments_role_idx" ON "cases"."case_assignments" USING btree ("role");
CREATE INDEX "case_history_case_id_idx" ON "cases"."case_history" USING btree ("case_id");
CREATE INDEX "case_history_entity_type_idx" ON "cases"."case_history" USING btree ("entity_type");
CREATE INDEX "case_history_entity_id_idx" ON "cases"."case_history" USING btree ("entity_id");
CREATE INDEX "case_history_changed_at_idx" ON "cases"."case_history" USING btree ("changed_at");
CREATE INDEX "audit_reports_case_id_idx" ON "cases"."audit_reports" USING btree ("case_id");
CREATE INDEX "audit_reports_status_idx" ON "cases"."audit_reports" USING btree ("status");
CREATE INDEX "audit_reports_generated_by_idx" ON "cases"."audit_reports" USING btree ("generated_by");
CREATE INDEX "audit_report_templates_case_type_idx" ON "cases"."audit_report_templates" USING btree ("case_type");
CREATE INDEX "audit_report_templates_active_idx" ON "cases"."audit_report_templates" USING btree ("is_active");
CREATE INDEX "audit_report_templates_org_idx" ON "cases"."audit_report_templates" USING btree ("organization_id");
CREATE INDEX "case_activities_case_id_idx" ON "cases"."case_activities" USING btree ("case_id");
CREATE INDEX "case_activities_user_id_idx" ON "cases"."case_activities" USING btree ("user_id");
CREATE INDEX "case_activities_type_idx" ON "cases"."case_activities" USING btree ("activity_type");
CREATE INDEX "case_activities_created_at_idx" ON "cases"."case_activities" USING btree ("created_at");
CREATE INDEX "case_presence_case_id_idx" ON "cases"."case_presence" USING btree ("case_id");
CREATE INDEX "case_presence_user_id_idx" ON "cases"."case_presence" USING btree ("user_id");
CREATE INDEX "case_presence_last_seen_idx" ON "cases"."case_presence" USING btree ("last_seen_at");
DROP TYPE "audit"."assignment_role";
DROP TYPE "audit"."audit_category";
DROP TYPE "audit"."audit_status";
DROP TYPE "audit"."audit_type";
DROP TYPE "audit"."case_action";
DROP TYPE "audit"."case_entity_type";
DROP TYPE "audit"."case_priority";
DROP TYPE "audit"."case_status";
DROP TYPE "audit"."note_type";
DROP TYPE "audit"."plan_status";
DROP TYPE "audit"."plan_type";
DROP TYPE "audit"."report_status";
DROP TYPE "audit"."activity_type";
DROP SCHEMA "audit";
