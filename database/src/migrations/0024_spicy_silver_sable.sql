CREATE SCHEMA "odoo";

CREATE TYPE "odoo"."circuit_state" AS ENUM('CLOSED', 'OPEN', 'HALF_OPEN');
CREATE TYPE "odoo"."operation_status" AS ENUM('processing', 'success', 'failed', 'retrying');
CREATE TABLE "identity"."odoo_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"operation_id" text NOT NULL,
	"operation_type" text NOT NULL,
	"odoo_model" text,
	"odoo_method" text,
	"odoo_record_ids" jsonb,
	"odoo_domain" jsonb,
	"request_payload" jsonb,
	"response_data" jsonb,
	"status" "odoo"."operation_status" NOT NULL,
	"error_message" text,
	"error_stack" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"duration_ms" integer,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"is_retry" boolean DEFAULT false NOT NULL,
	"parent_operation_id" text,
	"circuit_state" "odoo"."circuit_state",
	"user_id" uuid,
	"organization_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "odoo_audit_logs_operation_id_unique" UNIQUE("operation_id")
);

CREATE TABLE "identity"."odoo_idempotency_keys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"idempotency_key" text NOT NULL,
	"operation_type" text NOT NULL,
	"odoo_model" text,
	"status" "odoo"."operation_status" NOT NULL,
	"result_data" jsonb,
	"error_message" text,
	"first_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"operation_id" text NOT NULL,
	"user_id" uuid,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "odoo_idempotency_keys_idempotency_key_unique" UNIQUE("idempotency_key")
);

ALTER TABLE "identity"."odoo_users" RENAME COLUMN "odoo_password" TO "api_key";
ALTER TABLE "identity"."odoo_users" RENAME COLUMN "odoo_web_password" TO "password";
ALTER TABLE "identity"."odoo_databases" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
ALTER TABLE "identity"."odoo_users" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();
ALTER TABLE "identity"."odoo_audit_logs" ADD CONSTRAINT "odoo_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "identity"."odoo_audit_logs" ADD CONSTRAINT "odoo_audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "identity"."odoo_idempotency_keys" ADD CONSTRAINT "odoo_idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "identity"."odoo_idempotency_keys" ADD CONSTRAINT "odoo_idempotency_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "odoo_audit_logs_operation_id_idx" ON "identity"."odoo_audit_logs" USING btree ("operation_id");
CREATE INDEX "odoo_audit_logs_operation_type_idx" ON "identity"."odoo_audit_logs" USING btree ("operation_type");
CREATE INDEX "odoo_audit_logs_model_idx" ON "identity"."odoo_audit_logs" USING btree ("odoo_model");
CREATE INDEX "odoo_audit_logs_status_idx" ON "identity"."odoo_audit_logs" USING btree ("status");
CREATE INDEX "odoo_audit_logs_user_idx" ON "identity"."odoo_audit_logs" USING btree ("user_id");
CREATE INDEX "odoo_audit_logs_org_idx" ON "identity"."odoo_audit_logs" USING btree ("organization_id");
CREATE INDEX "odoo_audit_logs_created_at_idx" ON "identity"."odoo_audit_logs" USING btree ("created_at");
CREATE INDEX "odoo_audit_logs_parent_idx" ON "identity"."odoo_audit_logs" USING btree ("parent_operation_id");
CREATE INDEX "odoo_idempotency_key_idx" ON "identity"."odoo_idempotency_keys" USING btree ("idempotency_key");
CREATE INDEX "odoo_idempotency_status_idx" ON "identity"."odoo_idempotency_keys" USING btree ("status");
CREATE INDEX "odoo_idempotency_expires_idx" ON "identity"."odoo_idempotency_keys" USING btree ("expires_at");
CREATE INDEX "odoo_idempotency_org_idx" ON "identity"."odoo_idempotency_keys" USING btree ("organization_id");