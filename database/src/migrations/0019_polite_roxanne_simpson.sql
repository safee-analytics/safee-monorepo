ALTER TABLE "system"."approval_requests" DROP CONSTRAINT "approval_requests_requested_by_users_id_fk";

ALTER TABLE "audit"."cases" DROP CONSTRAINT "cases_created_by_users_id_fk";

ALTER TABLE "audit"."audit_templates" DROP CONSTRAINT "audit_templates_created_by_users_id_fk";

ALTER TABLE "audit"."audit_scopes" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "audit"."case_history" ALTER COLUMN "changed_by" DROP NOT NULL;
ALTER TABLE "identity"."users" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "system"."approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE cascade;
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "users_deleted_at_idx" ON "identity"."users" USING btree ("deleted_at");