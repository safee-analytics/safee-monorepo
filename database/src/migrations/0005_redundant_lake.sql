CREATE TYPE "public"."connection_status" AS ENUM('success', 'failed', 'untested');
CREATE TYPE "public"."connector_type" AS ENUM('postgresql', 'mysql', 'mssql');
ALTER TYPE "identity"."event_type" ADD VALUE 'password_change_failed' BEFORE 'session_revoked';
ALTER TYPE "identity"."event_type" ADD VALUE 'password_reset_requested' BEFORE 'session_revoked';
CREATE TABLE "identity"."connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"type" "connector_type" NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_connection_test" timestamp with time zone,
	"last_connection_status" "connection_status" DEFAULT 'untested',
	"last_connection_error" varchar(1000),
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "identity"."odoo_databases" DROP CONSTRAINT "odoo_databases_organization_id_organizations_id_fk";

ALTER TABLE "identity"."users" DROP CONSTRAINT "users_organization_id_organizations_id_fk";

ALTER TABLE "identity"."organization_services" DROP CONSTRAINT "organization_services_organization_id_organizations_id_fk";

ALTER TABLE "identity"."organization_services" DROP CONSTRAINT "organization_services_service_id_services_id_fk";

ALTER TABLE "identity"."user_services" DROP CONSTRAINT "user_services_user_id_users_id_fk";

ALTER TABLE "identity"."user_services" DROP CONSTRAINT "user_services_service_id_services_id_fk";

ALTER TABLE "sales"."contacts" DROP CONSTRAINT "contacts_organization_id_organizations_id_fk";

ALTER TABLE "sales"."deals" DROP CONSTRAINT "deals_contact_id_contacts_id_fk";

ALTER TABLE "sales"."deals" DROP CONSTRAINT "deals_organization_id_organizations_id_fk";

ALTER TABLE "hr"."employees" DROP CONSTRAINT "employees_organization_id_organizations_id_fk";

ALTER TABLE "finance"."invoice_items" DROP CONSTRAINT "invoice_items_invoice_id_invoices_id_fk";

ALTER TABLE "finance"."invoices" DROP CONSTRAINT "invoices_customer_id_contacts_id_fk";

ALTER TABLE "finance"."invoices" DROP CONSTRAINT "invoices_supplier_id_contacts_id_fk";

ALTER TABLE "finance"."invoices" DROP CONSTRAINT "invoices_organization_id_organizations_id_fk";

ALTER TABLE "finance"."accounts" DROP CONSTRAINT "accounts_organization_id_organizations_id_fk";

ALTER TABLE "hr"."payroll_records" DROP CONSTRAINT "payroll_records_employee_id_employees_id_fk";

ALTER TABLE "hr"."payroll_records" DROP CONSTRAINT "payroll_records_organization_id_organizations_id_fk";

ALTER TABLE "jobs"."jobs" DROP CONSTRAINT "jobs_schedule_id_job_schedules_id_fk";

ALTER TABLE "jobs"."jobs" DROP CONSTRAINT "jobs_organization_id_organizations_id_fk";

ALTER TABLE "jobs"."job_logs" DROP CONSTRAINT "job_logs_job_id_jobs_id_fk";

ALTER TABLE "system"."audit_events" DROP CONSTRAINT "audit_events_organization_id_organizations_id_fk";

ALTER TABLE "system"."audit_events" DROP CONSTRAINT "audit_events_user_id_users_id_fk";

ALTER TABLE "identity"."role_permissions" DROP CONSTRAINT "role_permissions_role_id_roles_id_fk";

ALTER TABLE "identity"."role_permissions" DROP CONSTRAINT "role_permissions_permission_id_permissions_id_fk";

ALTER TABLE "identity"."user_roles" DROP CONSTRAINT "user_roles_user_id_users_id_fk";

ALTER TABLE "identity"."user_roles" DROP CONSTRAINT "user_roles_role_id_roles_id_fk";

ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_user_id_users_id_fk";

ALTER TABLE "login_attempts" DROP CONSTRAINT "login_attempts_user_id_users_id_fk";

ALTER TABLE "security_events" DROP CONSTRAINT "security_events_user_id_users_id_fk";

ALTER TABLE "security_events" DROP CONSTRAINT "security_events_organization_id_organizations_id_fk";

ALTER TABLE "identity"."connectors" ADD CONSTRAINT "connectors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."connectors" ADD CONSTRAINT "connectors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "identity"."connectors" ADD CONSTRAINT "connectors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "identity"."odoo_databases" ADD CONSTRAINT "odoo_databases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."organization_services" ADD CONSTRAINT "organization_services_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."organization_services" ADD CONSTRAINT "organization_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "system"."services"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_services" ADD CONSTRAINT "user_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_services" ADD CONSTRAINT "user_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "system"."services"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "sales"."contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "sales"."deals" ADD CONSTRAINT "deals_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "sales"."contacts"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "sales"."deals" ADD CONSTRAINT "deals_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "finance"."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "finance"."invoices"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_customer_id_contacts_id_fk" FOREIGN KEY ("customer_id") REFERENCES "sales"."contacts"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_supplier_id_contacts_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "sales"."contacts"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "finance"."invoices" ADD CONSTRAINT "invoices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "finance"."accounts" ADD CONSTRAINT "accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."payroll_records" ADD CONSTRAINT "payroll_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "hr"."employees"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "hr"."payroll_records" ADD CONSTRAINT "payroll_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_schedule_id_job_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "jobs"."job_schedules"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "jobs"."jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "jobs"."job_logs" ADD CONSTRAINT "job_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"."jobs"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."audit_events" ADD CONSTRAINT "audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "identity"."roles"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "identity"."permissions"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "identity"."roles"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;