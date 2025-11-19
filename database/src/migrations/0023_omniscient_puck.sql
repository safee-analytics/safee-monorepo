CREATE TABLE "identity"."two_factors" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" uuid NOT NULL
);

CREATE TABLE "identity"."apikeys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" uuid NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp with time zone,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"permissions" text,
	"metadata" text
);

ALTER TABLE "identity"."users" RENAME COLUMN "phone" TO "phone_number";
ALTER TABLE "identity"."users" DROP CONSTRAINT "users_organization_id_organizations_id_fk";

ALTER TABLE "audit"."cases" DROP CONSTRAINT "cases_created_by_users_id_fk";

ALTER TABLE "audit"."audit_templates" DROP CONSTRAINT "audit_templates_created_by_users_id_fk";

ALTER TABLE "audit"."audit_scopes" DROP CONSTRAINT "audit_scopes_created_by_users_id_fk";

ALTER TABLE "audit"."audit_scopes" DROP CONSTRAINT "audit_scopes_completed_by_users_id_fk";

ALTER TABLE "audit"."audit_scopes" DROP CONSTRAINT "audit_scopes_archived_by_users_id_fk";

ALTER TABLE "audit"."audit_procedures" DROP CONSTRAINT "audit_procedures_completed_by_users_id_fk";

ALTER TABLE "audit"."case_documents" DROP CONSTRAINT "case_documents_uploaded_by_users_id_fk";

ALTER TABLE "audit"."case_notes" DROP CONSTRAINT "case_notes_created_by_users_id_fk";

ALTER TABLE "audit"."case_assignments" DROP CONSTRAINT "case_assignments_assigned_by_users_id_fk";

ALTER TABLE "audit"."case_history" DROP CONSTRAINT "case_history_changed_by_users_id_fk";

DROP INDEX "identity"."users_organization_id_idx";
ALTER TABLE "identity"."users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
ALTER TABLE "identity"."users" ADD COLUMN "phone_number_verified" boolean;
ALTER TABLE "identity"."two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."apikeys" ADD CONSTRAINT "apikeys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."audit_procedures" ADD CONSTRAINT "audit_procedures_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."case_notes" ADD CONSTRAINT "case_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."case_assignments" ADD CONSTRAINT "case_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."case_history" ADD CONSTRAINT "case_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "identity"."users" DROP COLUMN "organization_id";
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number");