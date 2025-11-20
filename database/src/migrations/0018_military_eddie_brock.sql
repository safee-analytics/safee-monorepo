ALTER TABLE "system"."approval_requests" DROP CONSTRAINT "approval_requests_requested_by_users_id_fk";

ALTER TABLE "audit"."cases" DROP CONSTRAINT "cases_created_by_users_id_fk";

ALTER TABLE "audit"."audit_templates" DROP CONSTRAINT "audit_templates_created_by_users_id_fk";

ALTER TABLE "audit"."cases" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "audit"."audit_templates" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "system"."approval_requests" ADD CONSTRAINT "approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;