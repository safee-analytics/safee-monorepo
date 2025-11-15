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

ALTER TABLE "audit"."cases" ALTER COLUMN "created_by" SET NOT NULL;
ALTER TABLE "audit"."audit_templates" ALTER COLUMN "created_by" SET NOT NULL;
ALTER TABLE "audit"."audit_scopes" ALTER COLUMN "created_by" SET NOT NULL;
ALTER TABLE "audit"."case_history" ALTER COLUMN "changed_by" SET NOT NULL;
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_templates" ADD CONSTRAINT "audit_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_scopes" ADD CONSTRAINT "audit_scopes_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."audit_procedures" ADD CONSTRAINT "audit_procedures_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."case_documents" ADD CONSTRAINT "case_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."case_notes" ADD CONSTRAINT "case_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."case_assignments" ADD CONSTRAINT "case_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;
ALTER TABLE "audit"."case_history" ADD CONSTRAINT "case_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "identity"."users"("id") ON DELETE restrict ON UPDATE no action;