CREATE TYPE "identity"."data_scope" AS ENUM('global', 'department', 'team', 'assigned', 'own');
ALTER TYPE "public"."service_type" SET SCHEMA "system";
ALTER TABLE "identity"."user_services" ADD COLUMN "data_scope" "identity"."data_scope" DEFAULT 'own' NOT NULL;
ALTER TABLE "identity"."user_services" ADD COLUMN "department_id" uuid;
ALTER TABLE "identity"."user_services" ADD COLUMN "team_id" uuid;
CREATE INDEX "user_services_data_scope_idx" ON "identity"."user_services" USING btree ("data_scope");