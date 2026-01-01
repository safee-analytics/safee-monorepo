CREATE TYPE "hr"."section_type" AS ENUM('self_service', 'management');
CREATE TYPE "identity"."resource_type" AS ENUM('audit_case', 'accounting_client', 'crm_lead', 'crm_deal', 'hr_department');
CREATE TYPE "odoo"."provisioning_status" AS ENUM('pending', 'provisioning', 'active', 'failed');
ALTER TYPE "jobs"."job_name" ADD VALUE 'odoo_provision_organization';
CREATE TABLE "identity"."module_access_rules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid,
	"module_key" varchar(50) NOT NULL,
	"role" varchar(50) NOT NULL,
	"has_access" boolean DEFAULT true NOT NULL,
	"allowed_sections" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "module_access_rules_organization_id_module_key_role_unique" UNIQUE("organization_id","module_key","role")
);

CREATE TABLE "identity"."resource_assignments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"resource_type" "identity"."resource_type" NOT NULL,
	"resource_id" uuid NOT NULL,
	"role" varchar(50),
	"assigned_by" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "resource_assignments_user_id_resource_type_resource_id_unique" UNIQUE("user_id","resource_type","resource_id")
);

CREATE TABLE "hr"."module_sections" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"section_key" varchar(50) NOT NULL,
	"section_type" "hr"."section_type" NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"path" varchar(255) NOT NULL,
	"required_permissions" text,
	"minimum_role" varchar(50),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "module_sections_section_key_unique" UNIQUE("section_key")
);

ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_status" "odoo"."provisioning_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_error" text;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_started_at" timestamp with time zone;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_completed_at" timestamp with time zone;
ALTER TABLE "identity"."module_access_rules" ADD CONSTRAINT "module_access_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "identity"."resource_assignments" ADD CONSTRAINT "resource_assignments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "identity"."resource_assignments" ADD CONSTRAINT "resource_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "identity"."resource_assignments" ADD CONSTRAINT "resource_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
CREATE INDEX "module_access_org_idx" ON "identity"."module_access_rules" USING btree ("organization_id");
CREATE INDEX "module_access_module_idx" ON "identity"."module_access_rules" USING btree ("module_key");
CREATE INDEX "module_access_role_idx" ON "identity"."module_access_rules" USING btree ("role");
CREATE INDEX "resource_assignments_user_idx" ON "identity"."resource_assignments" USING btree ("user_id");
CREATE INDEX "resource_assignments_resource_idx" ON "identity"."resource_assignments" USING btree ("resource_type","resource_id");
CREATE INDEX "resource_assignments_org_idx" ON "identity"."resource_assignments" USING btree ("organization_id");