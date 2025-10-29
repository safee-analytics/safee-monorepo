CREATE TABLE "identity"."odoo_databases" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"database_name" varchar(255) NOT NULL,
	"admin_login" varchar(255) NOT NULL,
	"admin_password" varchar(512) NOT NULL,
	"odoo_url" varchar(255) NOT NULL,
	"is_active" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "odoo_databases_organization_id_unique" UNIQUE("organization_id"),
	CONSTRAINT "odoo_databases_database_name_unique" UNIQUE("database_name")
);

ALTER TABLE "identity"."odoo_databases" ADD CONSTRAINT "odoo_databases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
