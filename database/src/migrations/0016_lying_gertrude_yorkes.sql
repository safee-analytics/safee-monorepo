CREATE SCHEMA "audit";

CREATE TYPE "audit"."assignment_role" AS ENUM('lead', 'reviewer', 'team_member');
CREATE TYPE "audit"."audit_status" AS ENUM('draft', 'in-progress', 'under-review', 'completed', 'archived');
CREATE TYPE "audit"."case_priority" AS ENUM('low', 'medium', 'high', 'critical');
CREATE TYPE "audit"."case_status" AS ENUM('pending', 'in-progress', 'under-review', 'completed', 'overdue', 'archived');
CREATE TYPE "audit"."note_type" AS ENUM('observation', 'review_comment', 'general', 'memo');
CREATE TABLE "audit"."cases" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"case_number" varchar(50) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"audit_type" varchar(100) NOT NULL,
	"status" "audit"."case_status" DEFAULT 'pending' NOT NULL,
	"priority" "audit"."case_priority" DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"completed_date" date,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);

CREATE TABLE "audit"."audit_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"audit_type" varchar(100) NOT NULL,
	"category" varchar(100),
	"version" varchar(50) DEFAULT '1.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"structure" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit"."audit_scopes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"template_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "audit"."audit_status" DEFAULT 'draft' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"completed_by" uuid,
	"archived_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone
);

CREATE TABLE "audit"."audit_sections" (
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

CREATE TABLE "audit"."audit_procedures" (
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

CREATE TABLE "audit"."case_documents" (
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
	"is_deleted" boolean DEFAULT false NOT NULL
);

CREATE TABLE "audit"."case_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"procedure_id" uuid,
	"note_type" "audit"."note_type" NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL
);

CREATE TABLE "audit"."case_assignments" (
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "audit"."assignment_role" NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_assignments_case_id_user_id_pk" PRIMARY KEY("case_id","user_id")
);

CREATE TABLE "audit"."case_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"changes_before" jsonb,
	"changes_after" jsonb,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_template_id_audit_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "audit"."audit_templates"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_sections" ADD CONSTRAINT "audit_sections_scope_id_audit_scopes_id_fk" FOREIGN KEY ("scope_id") REFERENCES "audit"."audit_scopes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_procedures" ADD CONSTRAINT "audit_procedures_section_id_audit_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "audit"."audit_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."audit_procedures" ADD CONSTRAINT "audit_procedures_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "audit"."audit_procedures"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_parent_document_id_case_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "audit"."case_documents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_notes" ADD CONSTRAINT "case_notes_procedure_id_audit_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "audit"."audit_procedures"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_notes" ADD CONSTRAINT "case_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."case_assignments" ADD CONSTRAINT "case_assignments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_assignments" ADD CONSTRAINT "case_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_assignments" ADD CONSTRAINT "case_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."case_history" ADD CONSTRAINT "case_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_history" ADD CONSTRAINT "case_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "cases_organization_id_idx" ON "audit"."cases" USING btree ("organization_id");
CREATE INDEX "cases_status_idx" ON "audit"."cases" USING btree ("status");
CREATE INDEX "cases_audit_type_idx" ON "audit"."cases" USING btree ("audit_type");
CREATE INDEX "cases_created_by_idx" ON "audit"."cases" USING btree ("created_by");
CREATE INDEX "audit_templates_organization_id_idx" ON "audit"."audit_templates" USING btree ("organization_id");
CREATE INDEX "audit_templates_audit_type_idx" ON "audit"."audit_templates" USING btree ("audit_type");
CREATE INDEX "audit_templates_is_active_idx" ON "audit"."audit_templates" USING btree ("is_active");
CREATE INDEX "audit_templates_is_public_idx" ON "audit"."audit_templates" USING btree ("is_public");
CREATE INDEX "audit_scopes_case_id_idx" ON "audit"."audit_scopes" USING btree ("case_id");
CREATE INDEX "audit_scopes_template_id_idx" ON "audit"."audit_scopes" USING btree ("template_id");
CREATE INDEX "audit_scopes_status_idx" ON "audit"."audit_scopes" USING btree ("status");
CREATE INDEX "audit_sections_scope_id_idx" ON "audit"."audit_sections" USING btree ("scope_id");
CREATE INDEX "audit_sections_sort_order_idx" ON "audit"."audit_sections" USING btree ("sort_order");
CREATE INDEX "audit_procedures_section_id_idx" ON "audit"."audit_procedures" USING btree ("section_id");
CREATE INDEX "audit_procedures_is_completed_idx" ON "audit"."audit_procedures" USING btree ("is_completed");
CREATE INDEX "audit_procedures_sort_order_idx" ON "audit"."audit_procedures" USING btree ("sort_order");
CREATE INDEX "case_documents_case_id_idx" ON "audit"."case_documents" USING btree ("case_id");
CREATE INDEX "case_documents_procedure_id_idx" ON "audit"."case_documents" USING btree ("procedure_id");
CREATE INDEX "case_documents_parent_document_id_idx" ON "audit"."case_documents" USING btree ("parent_document_id");
CREATE INDEX "case_documents_is_deleted_idx" ON "audit"."case_documents" USING btree ("is_deleted");
CREATE INDEX "case_notes_case_id_idx" ON "audit"."case_notes" USING btree ("case_id");
CREATE INDEX "case_notes_procedure_id_idx" ON "audit"."case_notes" USING btree ("procedure_id");
CREATE INDEX "case_notes_note_type_idx" ON "audit"."case_notes" USING btree ("note_type");
CREATE INDEX "case_notes_created_by_idx" ON "audit"."case_notes" USING btree ("created_by");
CREATE INDEX "case_assignments_user_id_idx" ON "audit"."case_assignments" USING btree ("user_id");
CREATE INDEX "case_assignments_role_idx" ON "audit"."case_assignments" USING btree ("role");
CREATE INDEX "case_history_case_id_idx" ON "audit"."case_history" USING btree ("case_id");
CREATE INDEX "case_history_entity_type_idx" ON "audit"."case_history" USING btree ("entity_type");
CREATE INDEX "case_history_entity_id_idx" ON "audit"."case_history" USING btree ("entity_id");
CREATE INDEX "case_history_changed_at_idx" ON "audit"."case_history" USING btree ("changed_at");