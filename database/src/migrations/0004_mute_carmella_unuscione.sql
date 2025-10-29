CREATE TYPE "public"."service_type" AS ENUM('accounting', 'sales', 'crm', 'purchase', 'inventory', 'mrp', 'hr', 'payroll', 'recruitment', 'expenses', 'project', 'timesheet', 'website', 'ecommerce', 'point_of_sale', 'marketing', 'email_marketing', 'helpdesk', 'planning', 'field_service');
CREATE TABLE "system"."services" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"description" text,
	"service_type" "service_type" NOT NULL,
	"icon" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" varchar(10) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_name_unique" UNIQUE("name")
);

CREATE TABLE "identity"."organization_services" (
	"organization_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"enabled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_services_organization_id_service_id_pk" PRIMARY KEY("organization_id","service_id")
);

CREATE TABLE "identity"."user_services" (
	"user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"enabled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_services_user_id_service_id_pk" PRIMARY KEY("user_id","service_id")
);

ALTER TABLE "identity"."organization_services" ADD CONSTRAINT "organization_services_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."organization_services" ADD CONSTRAINT "organization_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "system"."services"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_services" ADD CONSTRAINT "user_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_services" ADD CONSTRAINT "user_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "system"."services"("id") ON DELETE cascade ON UPDATE cascade;
CREATE INDEX "org_services_org_id_idx" ON "identity"."organization_services" USING btree ("organization_id");
CREATE INDEX "org_services_service_id_idx" ON "identity"."organization_services" USING btree ("service_id");
CREATE INDEX "org_services_is_enabled_idx" ON "identity"."organization_services" USING btree ("is_enabled");
CREATE INDEX "user_services_user_id_idx" ON "identity"."user_services" USING btree ("user_id");
CREATE INDEX "user_services_service_id_idx" ON "identity"."user_services" USING btree ("service_id");
CREATE INDEX "user_services_is_enabled_idx" ON "identity"."user_services" USING btree ("is_enabled");