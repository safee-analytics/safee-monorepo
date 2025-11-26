CREATE TYPE "sales"."activity_state" AS ENUM('planned', 'today', 'overdue', 'done');
CREATE TABLE "sales"."leads" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_lead_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"contact_name" varchar(255),
	"email_from" varchar(255),
	"phone" varchar(50),
	"partner_id" integer,
	"stage_id" integer,
	"team_id" integer,
	"user_id" integer,
	"expected_revenue" numeric(15, 2),
	"recurring_revenue" numeric(15, 2),
	"recurring_plan_id" integer,
	"date_open" timestamp with time zone,
	"date_deadline" timestamp with time zone,
	"date_closed" timestamp with time zone,
	"priority" varchar(10) DEFAULT '0',
	"active" boolean DEFAULT true NOT NULL,
	"description" text,
	"tag_ids" integer[],
	"lost_reason_id" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."stages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_stage_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"sequence" integer DEFAULT 10,
	"fold_stage" boolean DEFAULT false,
	"is_won" boolean DEFAULT false,
	"team_id" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."contacts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_partner_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_company" boolean DEFAULT false,
	"email" varchar(255),
	"phone" varchar(50),
	"mobile" varchar(50),
	"website" varchar(255),
	"street" varchar(255),
	"street2" varchar(255),
	"city" varchar(100),
	"state_id" integer,
	"country_id" integer,
	"zip" varchar(20),
	"vat" varchar(50),
	"industry_id" integer,
	"is_customer" boolean DEFAULT false,
	"is_supplier" boolean DEFAULT false,
	"active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_activity_id" integer NOT NULL,
	"lead_id" uuid,
	"activity_type_id" integer,
	"summary" varchar(255),
	"note" text,
	"date_due" timestamp with time zone,
	"user_id" integer,
	"state" "sales"."activity_state",
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."teams" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_team_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"user_id" integer,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sales"."lost_reasons" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"odoo_lost_reason_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "document_templates" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_templates" SET SCHEMA "system";

ALTER TABLE "hr"."employees" DROP CONSTRAINT "employees_user_id_users_id_fk";

ALTER TABLE "hr"."employees" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "sales"."leads" ADD CONSTRAINT "leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."stages" ADD CONSTRAINT "stages_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."contacts" ADD CONSTRAINT "contacts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."activities" ADD CONSTRAINT "activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "sales"."leads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sales"."lost_reasons" ADD CONSTRAINT "lost_reasons_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "hr"."employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;