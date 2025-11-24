CREATE TYPE "hr"."contract_state" AS ENUM('draft', 'open', 'close', 'cancel');
CREATE TYPE "hr"."employee_type" AS ENUM('employee', 'student', 'trainee', 'contractor', 'freelance');
CREATE TYPE "hr"."gender" AS ENUM('male', 'female', 'other');
CREATE TYPE "hr"."leave_state" AS ENUM('draft', 'confirm', 'refuse', 'validate1', 'validate', 'cancel');
CREATE TYPE "hr"."marital_status" AS ENUM('single', 'married', 'cohabitant', 'widower', 'divorced');
CREATE TYPE "hr"."payslip_state" AS ENUM('draft', 'verify', 'done', 'cancel');
CREATE TABLE "finance"."taxes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_tax_id" integer,
	"name" varchar(255) NOT NULL,
	"description" varchar(255),
	"amount" numeric(10, 6) NOT NULL,
	"amount_type" varchar(50) DEFAULT 'percent' NOT NULL,
	"tax_scope" varchar(50),
	"type_of_tax" varchar(50),
	"tax_group" varchar(100),
	"price_include" boolean DEFAULT false,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."departments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_department_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"manager_id" uuid,
	"parent_id" uuid,
	"color" integer,
	"note" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."payslips" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_payslip_id" integer,
	"number" varchar(100) NOT NULL,
	"employee_id" uuid NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"state" "hr"."payslip_state" DEFAULT 'draft' NOT NULL,
	"basic_wage" numeric(15, 2),
	"net_wage" numeric(15, 2),
	"gross_wage" numeric(15, 2),
	"contract_id" uuid,
	"struct_id" integer,
	"credit_note" boolean DEFAULT false,
	"paid_date" date,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."payslip_lines" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"payslip_id" uuid NOT NULL,
	"odoo_line_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"category" varchar(50),
	"sequence" integer,
	"quantity" numeric(10, 2) DEFAULT '1',
	"rate" numeric(10, 2) DEFAULT '100',
	"amount" numeric(15, 2) NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."leave_types" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_leave_type_id" integer,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"allocation_unit" varchar(20) DEFAULT 'day',
	"request_unit" varchar(20) DEFAULT 'day',
	"time_type" varchar(20) DEFAULT 'leave',
	"color" integer,
	"validation_type" varchar(50) DEFAULT 'no_validation',
	"max_leaves" numeric(10, 2),
	"leaves_per_year" numeric(10, 2),
	"unpaid" boolean DEFAULT false,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_leave_id" integer,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"number_of_days" numeric(10, 2) NOT NULL,
	"state" "hr"."leave_state" DEFAULT 'draft' NOT NULL,
	"request_date_from" timestamp with time zone,
	"request_unit_half" boolean DEFAULT false,
	"request_unit_hours" boolean DEFAULT false,
	"request_hour_from" varchar(10),
	"request_hour_to" varchar(10),
	"notes" text,
	"manager_id" uuid,
	"department_id" uuid,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."leave_allocations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_allocation_id" integer,
	"employee_id" uuid NOT NULL,
	"leave_type_id" uuid NOT NULL,
	"number_of_days" numeric(10, 2) NOT NULL,
	"number_of_days_display" numeric(10, 2),
	"date_from" date,
	"date_to" date,
	"state" "hr"."leave_state" DEFAULT 'draft' NOT NULL,
	"name" varchar(255),
	"notes" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "hr"."contracts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_contract_id" integer,
	"name" varchar(255) NOT NULL,
	"employee_id" uuid NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date,
	"state" "hr"."contract_state" DEFAULT 'draft' NOT NULL,
	"job_id" integer,
	"job_title" varchar(255),
	"department_id" uuid,
	"wage" numeric(15, 2) NOT NULL,
	"wage_type" varchar(20) DEFAULT 'monthly',
	"struct_id" integer,
	"working_schedule_id" integer,
	"notes" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "hr"."payroll_records" DISABLE ROW LEVEL SECURITY;
DROP TABLE "hr"."payroll_records" CASCADE;
DROP INDEX "hr"."employees_organization_id_idx";
ALTER TABLE "hr"."employees" ALTER COLUMN "hire_date" DROP NOT NULL;
ALTER TABLE "hr"."employees" ADD COLUMN "odoo_employee_id" integer;
ALTER TABLE "hr"."employees" ADD COLUMN "odoo_user_id" integer;
ALTER TABLE "hr"."employees" ADD COLUMN "user_id" uuid;
ALTER TABLE "hr"."employees" ADD COLUMN "employee_number" varchar(50);
ALTER TABLE "hr"."employees" ADD COLUMN "name" varchar(255) NOT NULL;
ALTER TABLE "hr"."employees" ADD COLUMN "mobile" varchar(50);
ALTER TABLE "hr"."employees" ADD COLUMN "job_title" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "department_id" uuid;
ALTER TABLE "hr"."employees" ADD COLUMN "manager_id" uuid;
ALTER TABLE "hr"."employees" ADD COLUMN "work_location" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "work_email" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "work_phone" varchar(50);
ALTER TABLE "hr"."employees" ADD COLUMN "employee_type" "hr"."employee_type" DEFAULT 'employee';
ALTER TABLE "hr"."employees" ADD COLUMN "gender" "hr"."gender";
ALTER TABLE "hr"."employees" ADD COLUMN "marital_status" "hr"."marital_status";
ALTER TABLE "hr"."employees" ADD COLUMN "birthday" date;
ALTER TABLE "hr"."employees" ADD COLUMN "place_of_birth" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "country_of_birth" varchar(2);
ALTER TABLE "hr"."employees" ADD COLUMN "nationality" varchar(2);
ALTER TABLE "hr"."employees" ADD COLUMN "identification_id" varchar(100);
ALTER TABLE "hr"."employees" ADD COLUMN "passport_id" varchar(100);
ALTER TABLE "hr"."employees" ADD COLUMN "bank_account_number" varchar(100);
ALTER TABLE "hr"."employees" ADD COLUMN "bank_name" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "bank_iban" varchar(100);
ALTER TABLE "hr"."employees" ADD COLUMN "emergency_contact" varchar(255);
ALTER TABLE "hr"."employees" ADD COLUMN "emergency_phone" varchar(50);
ALTER TABLE "hr"."employees" ADD COLUMN "emergency_relation" varchar(100);
ALTER TABLE "hr"."employees" ADD COLUMN "termination_date" date;
ALTER TABLE "hr"."employees" ADD COLUMN "contract_id" uuid;
ALTER TABLE "hr"."employees" ADD COLUMN "photo_url" varchar(512);
ALTER TABLE "hr"."employees" ADD COLUMN "notes" text;
ALTER TABLE "hr"."employees" ADD COLUMN "active" boolean DEFAULT true NOT NULL;
ALTER TABLE "hr"."employees" ADD COLUMN "last_synced_at" timestamp with time zone;
ALTER TABLE "finance"."accounts" ADD COLUMN "odoo_account_id" integer;
ALTER TABLE "finance"."accounts" ADD COLUMN "account_type" varchar(100) NOT NULL;
ALTER TABLE "finance"."accounts" ADD COLUMN "internal_type" varchar(100);
ALTER TABLE "finance"."accounts" ADD COLUMN "reconcile" boolean DEFAULT false;
ALTER TABLE "finance"."accounts" ADD COLUMN "deprecated" boolean DEFAULT false;
ALTER TABLE "finance"."accounts" ADD COLUMN "currency_id" integer;
ALTER TABLE "finance"."accounts" ADD COLUMN "company_id" integer;
ALTER TABLE "finance"."accounts" ADD COLUMN "last_synced_at" timestamp with time zone;
ALTER TABLE "finance"."taxes" ADD CONSTRAINT "taxes_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."departments" ADD CONSTRAINT "departments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."departments" ADD CONSTRAINT "departments_parent_id_departments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "hr"."departments"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "hr"."payslips" ADD CONSTRAINT "payslips_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."payslip_lines" ADD CONSTRAINT "payslip_lines_payslip_id_payslips_id_fk" FOREIGN KEY ("payslip_id") REFERENCES "hr"."payslips"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."leave_types" ADD CONSTRAINT "leave_types_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."leave_requests" ADD CONSTRAINT "leave_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."leave_allocations" ADD CONSTRAINT "leave_allocations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "hr"."contracts" ADD CONSTRAINT "contracts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
CREATE INDEX "taxes_organization_id_idx" ON "finance"."taxes" USING btree ("organization_id");
CREATE INDEX "taxes_odoo_tax_id_idx" ON "finance"."taxes" USING btree ("odoo_tax_id");
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_manager_id_employees_id_fk" FOREIGN KEY ("manager_id") REFERENCES "hr"."employees"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "accounts_odoo_account_id_idx" ON "finance"."accounts" USING btree ("odoo_account_id");
ALTER TABLE "identity"."users" DROP COLUMN "job_title";
ALTER TABLE "identity"."users" DROP COLUMN "department";
ALTER TABLE "identity"."users" DROP COLUMN "company";
ALTER TABLE "identity"."users" DROP COLUMN "location";
ALTER TABLE "hr"."employees" DROP COLUMN "employee_id";
ALTER TABLE "hr"."employees" DROP COLUMN "first_name";
ALTER TABLE "hr"."employees" DROP COLUMN "last_name";
ALTER TABLE "hr"."employees" DROP COLUMN "department_en";
ALTER TABLE "hr"."employees" DROP COLUMN "department_ar";
ALTER TABLE "hr"."employees" DROP COLUMN "position_en";
ALTER TABLE "hr"."employees" DROP COLUMN "position_ar";
ALTER TABLE "hr"."employees" DROP COLUMN "salary";
ALTER TABLE "hr"."employees" DROP COLUMN "status";
ALTER TABLE "finance"."accounts" DROP COLUMN "type";
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_employee_number_unique" UNIQUE("employee_number");