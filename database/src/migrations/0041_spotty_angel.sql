CREATE TYPE "identity"."resource_type" AS ENUM('audit_case', 'accounting_client', 'crm_lead', 'crm_deal', 'hr_department');
CREATE TYPE "hr"."section_type" AS ENUM('self_service', 'management');
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

-- Insert default global module access rules (organizationId = NULL means global default)
-- Owner and Admin: Full access to all modules
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'accounting', 'owner', true),
  (NULL, 'hr', 'owner', true),
  (NULL, 'crm', 'owner', true),
  (NULL, 'audit', 'owner', true),
  (NULL, 'accounting', 'admin', true),
  (NULL, 'hr', 'admin', true),
  (NULL, 'crm', 'admin', true),
  (NULL, 'audit', 'admin', true)
ON CONFLICT DO NOTHING;

-- Audit roles: audit module + HR self-service
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'audit', 'audit_manager', true),
  (NULL, 'hr', 'audit_manager', true),
  (NULL, 'audit', 'senior_auditor', true),
  (NULL, 'hr', 'senior_auditor', true),
  (NULL, 'audit', 'auditor', true),
  (NULL, 'hr', 'auditor', true)
ON CONFLICT DO NOTHING;

-- Accounting roles: accounting module + HR self-service
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'accounting', 'accounting_manager', true),
  (NULL, 'hr', 'accounting_manager', true),
  (NULL, 'accounting', 'senior_accountant', true),
  (NULL, 'hr', 'senior_accountant', true),
  (NULL, 'accounting', 'accountant', true),
  (NULL, 'hr', 'accountant', true)
ON CONFLICT DO NOTHING;

-- HR roles: full HR access
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'hr', 'hr_manager', true),
  (NULL, 'hr', 'hr_coordinator', true)
ON CONFLICT DO NOTHING;

-- Sales/CRM roles: CRM module + HR self-service
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'crm', 'sales_manager', true),
  (NULL, 'hr', 'sales_manager', true),
  (NULL, 'crm', 'sales_rep', true),
  (NULL, 'hr', 'sales_rep', true)
ON CONFLICT DO NOTHING;

-- Generic roles: HR self-service only
INSERT INTO identity.module_access_rules (organization_id, module_key, role, has_access) VALUES
  (NULL, 'hr', 'manager', true),
  (NULL, 'hr', 'senior_member', true),
  (NULL, 'hr', 'member', true),
  (NULL, 'hr', 'viewer', true)
ON CONFLICT DO NOTHING;

-- Insert default HR module sections
-- Self-service sections (accessible to all users)
INSERT INTO hr.module_sections (section_key, section_type, display_name, description, path, sort_order, is_active) VALUES
  ('my-info', 'self_service', 'My Information', 'View and update personal information', '/hr/my-info', 1, true),
  ('my-time-off', 'self_service', 'My Time Off', 'Request vacation and view time off balance', '/hr/my-time-off', 2, true),
  ('my-payslips', 'self_service', 'My Payslips', 'View and download payslips', '/hr/my-payslips', 3, true),
  ('my-documents', 'self_service', 'My Documents', 'Access HR documents and contracts', '/hr/my-documents', 4, true)
ON CONFLICT (section_key) DO NOTHING;

-- Management sections (HR roles only)
INSERT INTO hr.module_sections (section_key, section_type, display_name, description, path, minimum_role, sort_order, is_active) VALUES
  ('employees', 'management', 'Employees', 'Manage employee records and information', '/hr/employees', 'hr_coordinator', 10, true),
  ('departments', 'management', 'Departments', 'Manage organizational departments', '/hr/departments', 'hr_coordinator', 11, true),
  ('payroll', 'management', 'Payroll', 'Process payroll and manage compensation', '/hr/payroll', 'hr_manager', 12, true),
  ('time-off-approvals', 'management', 'Time Off Approvals', 'Review and approve time off requests', '/hr/time-off-approvals', 'hr_coordinator', 13, true),
  ('contracts', 'management', 'Contracts', 'Manage employee contracts and agreements', '/hr/contracts', 'hr_manager', 14, true)
ON CONFLICT (section_key) DO NOTHING;