CREATE TYPE "audit"."activity_type" AS ENUM('case_created', 'status_changed', 'priority_updated', 'document_uploaded', 'document_approved', 'document_rejected', 'comment_added', 'team_member_assigned', 'team_member_removed', 'case_completed', 'case_archived', 'scope_created', 'procedure_completed', 'plan_created', 'report_generated');
CREATE TABLE "audit"."case_activities" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"activity_type" "audit"."activity_type" NOT NULL,
	"user_id" uuid,
	"metadata" jsonb,
	"is_read" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit"."case_presence" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"case_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "audit"."case_activities" ADD CONSTRAINT "case_activities_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_activities" ADD CONSTRAINT "case_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "audit"."case_presence" ADD CONSTRAINT "case_presence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "audit"."cases"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit"."case_presence" ADD CONSTRAINT "case_presence_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "case_activities_case_id_idx" ON "audit"."case_activities" USING btree ("case_id");
CREATE INDEX "case_activities_user_id_idx" ON "audit"."case_activities" USING btree ("user_id");
CREATE INDEX "case_activities_type_idx" ON "audit"."case_activities" USING btree ("activity_type");
CREATE INDEX "case_activities_created_at_idx" ON "audit"."case_activities" USING btree ("created_at");
CREATE INDEX "case_presence_case_id_idx" ON "audit"."case_presence" USING btree ("case_id");
CREATE INDEX "case_presence_user_id_idx" ON "audit"."case_presence" USING btree ("user_id");
CREATE INDEX "case_presence_last_seen_idx" ON "audit"."case_presence" USING btree ("last_seen_at");