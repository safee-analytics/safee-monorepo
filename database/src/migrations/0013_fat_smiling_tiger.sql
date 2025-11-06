CREATE TYPE "system"."approver_type" AS ENUM('role', 'team', 'user');
CREATE TYPE "system"."step_type" AS ENUM('single', 'parallel', 'any');
CREATE TYPE "system"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');
CREATE TABLE "identity"."notification_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT true NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"audit_case_updates" boolean DEFAULT true NOT NULL,
	"document_uploads" boolean DEFAULT true NOT NULL,
	"task_assignments" boolean DEFAULT true NOT NULL,
	"system_alerts" boolean DEFAULT true NOT NULL,
	"team_mentions" boolean DEFAULT true NOT NULL,
	"deadline_reminders" boolean DEFAULT true NOT NULL,
	"frequency" varchar(20) DEFAULT 'instant' NOT NULL,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" time,
	"quiet_hours_end" time,
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "identity"."appearance_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"theme" varchar(20) DEFAULT 'light' NOT NULL,
	"color_scheme" varchar(20) DEFAULT 'blue' NOT NULL,
	"font_size" varchar(20) DEFAULT 'medium' NOT NULL,
	"density" varchar(20) DEFAULT 'comfortable' NOT NULL,
	"animations_enabled" boolean DEFAULT true NOT NULL,
	"reduced_motion" boolean DEFAULT false NOT NULL,
	CONSTRAINT "appearance_settings_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "identity"."organization_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" varchar(100) NOT NULL,
	"permission" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."teams" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."team_members" (
	"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);

CREATE TABLE "system"."approval_workflows" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "system"."entity_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"rules" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "system"."approval_workflow_steps" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"step_type" "system"."step_type" DEFAULT 'single' NOT NULL,
	"approver_type" "system"."approver_type" NOT NULL,
	"approver_id" uuid,
	"min_approvals" integer DEFAULT 1 NOT NULL,
	"required_approvers" integer DEFAULT 1 NOT NULL
);

CREATE TABLE "system"."approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"entity_type" "system"."entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"status" "system"."approval_status" DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);

CREATE TABLE "system"."approval_steps" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"request_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"approver_id" uuid NOT NULL,
	"status" "system"."approval_status" DEFAULT 'pending' NOT NULL,
	"comments" text,
	"action_at" timestamp with time zone,
	"delegated_to" uuid
);

CREATE TABLE "system"."approval_rules" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"entity_type" "system"."entity_type" NOT NULL,
	"rule_name" varchar(255) NOT NULL,
	"conditions" text NOT NULL,
	"workflow_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL
);

ALTER TABLE "identity"."notification_settings" ADD CONSTRAINT "notification_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."appearance_settings" ADD CONSTRAINT "appearance_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."organization_roles" ADD CONSTRAINT "organization_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "identity"."teams"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."approval_workflows" ADD CONSTRAINT "approval_workflows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."approval_workflow_steps" ADD CONSTRAINT "approval_workflow_steps_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "system"."approval_workflows"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."approval_requests" ADD CONSTRAINT "approval_requests_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "system"."approval_workflows"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "system"."approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "system"."approval_steps" ADD CONSTRAINT "approval_steps_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "system"."approval_requests"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."approval_steps" ADD CONSTRAINT "approval_steps_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "system"."approval_steps" ADD CONSTRAINT "approval_steps_delegated_to_users_id_fk" FOREIGN KEY ("delegated_to") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "system"."approval_rules" ADD CONSTRAINT "approval_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."approval_rules" ADD CONSTRAINT "approval_rules_workflow_id_approval_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "system"."approval_workflows"("id") ON DELETE cascade ON UPDATE cascade;
CREATE INDEX "notification_settings_user_id_idx" ON "identity"."notification_settings" USING btree ("user_id");
CREATE INDEX "appearance_settings_user_id_idx" ON "identity"."appearance_settings" USING btree ("user_id");
CREATE INDEX "organization_roles_org_id_idx" ON "identity"."organization_roles" USING btree ("organization_id");
CREATE INDEX "organization_roles_role_idx" ON "identity"."organization_roles" USING btree ("role");
CREATE INDEX "teams_organization_id_idx" ON "identity"."teams" USING btree ("organization_id");
CREATE INDEX "teams_name_idx" ON "identity"."teams" USING btree ("name");
CREATE INDEX "team_members_team_id_idx" ON "identity"."team_members" USING btree ("team_id");
CREATE INDEX "team_members_user_id_idx" ON "identity"."team_members" USING btree ("user_id");
CREATE INDEX "approval_workflows_org_id_idx" ON "system"."approval_workflows" USING btree ("organization_id");
CREATE INDEX "approval_workflows_entity_type_idx" ON "system"."approval_workflows" USING btree ("entity_type");
CREATE INDEX "approval_workflows_is_active_idx" ON "system"."approval_workflows" USING btree ("is_active");
CREATE INDEX "approval_workflow_steps_workflow_id_idx" ON "system"."approval_workflow_steps" USING btree ("workflow_id");
CREATE INDEX "approval_workflow_steps_step_order_idx" ON "system"."approval_workflow_steps" USING btree ("step_order");
CREATE INDEX "approval_requests_workflow_id_idx" ON "system"."approval_requests" USING btree ("workflow_id");
CREATE INDEX "approval_requests_entity_idx" ON "system"."approval_requests" USING btree ("entity_type","entity_id");
CREATE INDEX "approval_requests_status_idx" ON "system"."approval_requests" USING btree ("status");
CREATE INDEX "approval_requests_requested_by_idx" ON "system"."approval_requests" USING btree ("requested_by");
CREATE INDEX "approval_steps_request_id_idx" ON "system"."approval_steps" USING btree ("request_id");
CREATE INDEX "approval_steps_approver_id_idx" ON "system"."approval_steps" USING btree ("approver_id");
CREATE INDEX "approval_steps_status_idx" ON "system"."approval_steps" USING btree ("status");
CREATE INDEX "approval_steps_delegated_to_idx" ON "system"."approval_steps" USING btree ("delegated_to");
CREATE INDEX "approval_rules_org_id_idx" ON "system"."approval_rules" USING btree ("organization_id");
CREATE INDEX "approval_rules_entity_type_idx" ON "system"."approval_rules" USING btree ("entity_type");
CREATE INDEX "approval_rules_workflow_id_idx" ON "system"."approval_rules" USING btree ("workflow_id");
CREATE INDEX "approval_rules_priority_idx" ON "system"."approval_rules" USING btree ("priority");