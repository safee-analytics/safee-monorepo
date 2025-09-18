CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA "finance";

CREATE SCHEMA "hr";

CREATE SCHEMA "identity";

CREATE SCHEMA "sales";

CREATE SCHEMA "system";

CREATE TYPE "sales"."contact_type" AS ENUM('LEAD', 'PROSPECT', 'CUSTOMER', 'SUPPLIER');
CREATE TYPE "sales"."deal_stage" AS ENUM('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
CREATE TYPE "finance"."invoice_type" AS ENUM('SALES', 'PURCHASE');
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
CREATE INDEX "users_organization_id_idx" ON "identity"."users" USING btree ("organization_id");
CREATE INDEX "users_is_active_idx" ON "identity"."users" USING btree ("is_active");
CREATE INDEX "deals_organization_id_idx" ON "sales"."deals" USING btree ("organization_id");
CREATE INDEX "employees_organization_id_idx" ON "hr"."employees" USING btree ("organization_id");
CREATE INDEX "invoice_items_invoice_id_idx" ON "finance"."invoice_items" USING btree ("invoice_id");
CREATE INDEX "invoices_organization_id_idx" ON "finance"."invoices" USING btree ("organization_id");
CREATE INDEX "accounts_organization_id_idx" ON "finance"."accounts" USING btree ("organization_id");
CREATE INDEX "payroll_records_organization_id_idx" ON "hr"."payroll_records" USING btree ("organization_id");
CREATE INDEX "payroll_records_employee_id_idx" ON "hr"."payroll_records" USING btree ("employee_id"); 
