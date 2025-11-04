ALTER TYPE "public"."connection_status" SET SCHEMA "identity";
ALTER TYPE "public"."connector_type" SET SCHEMA "identity";
CREATE TABLE "identity"."odoo_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"odoo_database_id" uuid NOT NULL,
	"odoo_uid" integer NOT NULL,
	"odoo_login" varchar(255) NOT NULL,
	"odoo_password" varchar(512) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);

CREATE TABLE "identity"."oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(100) NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."verifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "security_events" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING metadata::jsonb;
ALTER TABLE "identity"."users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "identity"."users" ADD COLUMN "image" text;
ALTER TABLE "identity"."odoo_users" ADD CONSTRAINT "odoo_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."odoo_users" ADD CONSTRAINT "odoo_users_odoo_database_id_odoo_databases_id_fk" FOREIGN KEY ("odoo_database_id") REFERENCES "identity"."odoo_databases"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
CREATE INDEX "users_email_verified_idx" ON "identity"."users" USING btree ("email_verified");
ALTER TABLE "identity"."users" DROP COLUMN "password_hash";

