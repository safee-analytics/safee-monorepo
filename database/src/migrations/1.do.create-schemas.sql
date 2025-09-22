CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA "finance";

CREATE SCHEMA "hr";

CREATE SCHEMA "identity";

CREATE SCHEMA "jobs";

CREATE SCHEMA "sales";

CREATE SCHEMA "system";

CREATE TYPE "system"."action" AS ENUM('created', 'updated', 'deleted', 'completed', 'failed', 'started', 'cancelled', 'retrying');
CREATE TYPE "sales"."contact_type" AS ENUM('LEAD', 'PROSPECT', 'CUSTOMER', 'SUPPLIER');
CREATE TYPE "sales"."deal_stage" AS ENUM('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
CREATE TYPE "system"."entity_type" AS ENUM('job', 'invoice', 'user', 'organization', 'employee', 'contact', 'deal');
CREATE TYPE "finance"."invoice_type" AS ENUM('SALES', 'PURCHASE');
CREATE TYPE "jobs"."job_status" AS ENUM('pending', 'running', 'completed', 'failed', 'cancelled', 'retrying');
CREATE TYPE "jobs"."job_type" AS ENUM('cron', 'scheduled', 'immediate', 'recurring');
CREATE TYPE "jobs"."log_level" AS ENUM('debug', 'info', 'warn', 'error');
CREATE TYPE "jobs"."priority" AS ENUM('low', 'normal', 'high', 'critical');
CREATE TYPE "identity"."user_role" AS ENUM('ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT');
CREATE TABLE "identity"."organizations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

CREATE TABLE "identity"."users" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"password_hash" varchar(255) NOT NULL,
	"role" "identity"."user_role" DEFAULT 'EMPLOYEE' NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "sales"."contacts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"type" "sales"."contact_type" DEFAULT 'LEAD' NOT NULL,
	"source" varchar(100),
	"notes" varchar(1000),
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."deals" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"title" varchar(255) NOT NULL,
	"value" numeric(12, 2),
	"stage" "sales"."deal_stage" DEFAULT 'LEAD' NOT NULL,
	"probability" integer,
	"expected_close_date" timestamp with time zone,
	"contact_id" uuid,
	"notes" varchar(1000),
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."employees" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"employee_id" varchar(50) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"hire_date" date NOT NULL,
	"department" varchar(100),
	"position" varchar(100),
	"salary" numeric(12, 2),
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "finance"."invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" varchar(255) NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "finance"."invoices" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"number" varchar(100) NOT NULL,
	"type" "finance"."invoice_type" NOT NULL,
	"date" date NOT NULL,
	"due_date" date,
	"customer_id" uuid,
	"supplier_id" uuid,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" varchar(50) DEFAULT 'DRAFT' NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);

CREATE TABLE "finance"."accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"parent_id" uuid,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."payroll_records" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"employee_id" uuid NOT NULL,
	"pay_period" varchar(50) NOT NULL,
	"base_salary" numeric(12, 2) NOT NULL,
	"net_pay" numeric(12, 2) NOT NULL,
	"pay_date" date NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "jobs"."job_definitions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"handler_name" text NOT NULL,
	"default_payload" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"retry_delay_ms" integer DEFAULT 60000 NOT NULL,
	"timeout_ms" integer DEFAULT 300000 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_definitions_name_unique" UNIQUE("name")
);

CREATE TABLE "jobs"."job_schedules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"job_definition_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cron_expression" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "jobs"."jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"job_definition_id" uuid NOT NULL,
	"schedule_id" uuid,
	"organization_id" uuid,
	"status" "jobs"."job_status" DEFAULT 'pending' NOT NULL,
	"type" "jobs"."job_type" DEFAULT 'immediate' NOT NULL,
	"priority" "jobs"."priority" DEFAULT 'normal' NOT NULL,
	"payload" jsonb,
	"result" jsonb,
	"error" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"scheduled_for" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "jobs"."job_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"job_id" uuid NOT NULL,
	"level" "jobs"."log_level" NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "system"."audit_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"entity_type" "system"."entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "system"."action" NOT NULL,
	"organization_id" uuid,
	"user_id" uuid,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "identity"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sales"."contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sales"."deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "sales"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sales"."deals" ADD CONSTRAINT "deals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "finance"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "finance"."invoices"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "sales"."contacts"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "finance"."accounts" ADD CONSTRAINT "accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "hr"."payroll_records" ADD CONSTRAINT "payroll_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "hr"."payroll_records" ADD CONSTRAINT "payroll_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs"."job_schedules" ADD CONSTRAINT "job_schedules_job_definition_id_job_definitions_id_fk" FOREIGN KEY ("job_definition_id") REFERENCES "jobs"."job_definitions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_job_definition_id_job_definitions_id_fk" FOREIGN KEY ("job_definition_id") REFERENCES "jobs"."job_definitions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_schedule_id_job_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "jobs"."job_schedules"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "jobs"."job_logs" ADD CONSTRAINT "job_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"."jobs"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "system"."audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "system"."audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "users_organization_id_idx" ON "identity"."users" USING btree ("organization_id");
CREATE INDEX "users_is_active_idx" ON "identity"."users" USING btree ("is_active");
CREATE INDEX "deals_organization_id_idx" ON "sales"."deals" USING btree ("organization_id");
CREATE INDEX "employees_organization_id_idx" ON "hr"."employees" USING btree ("organization_id");
CREATE INDEX "invoice_items_invoice_id_idx" ON "finance"."invoice_items" USING btree ("invoice_id");
CREATE INDEX "invoices_organization_id_idx" ON "finance"."invoices" USING btree ("organization_id");
CREATE INDEX "accounts_organization_id_idx" ON "finance"."accounts" USING btree ("organization_id");
CREATE INDEX "payroll_records_organization_id_idx" ON "hr"."payroll_records" USING btree ("organization_id");
CREATE INDEX "payroll_records_employee_id_idx" ON "hr"."payroll_records" USING btree ("employee_id");
CREATE INDEX "job_definitions_name_idx" ON "jobs"."job_definitions" USING btree ("name");
CREATE INDEX "job_definitions_handler_idx" ON "jobs"."job_definitions" USING btree ("handler_name");
CREATE INDEX "job_definitions_active_idx" ON "jobs"."job_definitions" USING btree ("is_active");
CREATE INDEX "job_schedules_definition_idx" ON "jobs"."job_schedules" USING btree ("job_definition_id");
CREATE INDEX "job_schedules_next_run_idx" ON "jobs"."job_schedules" USING btree ("next_run_at");
CREATE INDEX "job_schedules_active_idx" ON "jobs"."job_schedules" USING btree ("is_active");
CREATE INDEX "jobs_status_idx" ON "jobs"."jobs" USING btree ("status");
CREATE INDEX "jobs_scheduled_for_idx" ON "jobs"."jobs" USING btree ("scheduled_for");
CREATE INDEX "jobs_organization_idx" ON "jobs"."jobs" USING btree ("organization_id");
CREATE INDEX "jobs_priority_idx" ON "jobs"."jobs" USING btree ("priority");
CREATE INDEX "jobs_type_idx" ON "jobs"."jobs" USING btree ("type");
CREATE INDEX "jobs_created_at_idx" ON "jobs"."jobs" USING btree ("created_at");
CREATE INDEX "jobs_definition_idx" ON "jobs"."jobs" USING btree ("job_definition_id");
CREATE INDEX "job_logs_job_idx" ON "jobs"."job_logs" USING btree ("job_id");
CREATE INDEX "job_logs_level_idx" ON "jobs"."job_logs" USING btree ("level");
CREATE INDEX "job_logs_created_at_idx" ON "jobs"."job_logs" USING btree ("created_at");
CREATE INDEX "audit_events_entity_idx" ON "system"."audit_events" USING btree ("entity_type","entity_id");
CREATE INDEX "audit_events_org_idx" ON "system"."audit_events" USING btree ("organization_id");
CREATE INDEX "audit_events_user_idx" ON "system"."audit_events" USING btree ("user_id");
CREATE INDEX "audit_events_action_idx" ON "system"."audit_events" USING btree ("action");
CREATE INDEX "audit_events_created_at_idx" ON "system"."audit_events" USING btree ("created_at");
