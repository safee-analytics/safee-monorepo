ALTER TABLE "public"."user_sessions" SET SCHEMA "identity";

ALTER TABLE "public"."login_attempts" SET SCHEMA "identity";

ALTER TABLE "public"."security_events" SET SCHEMA "identity";

ALTER TABLE "identity"."users" ADD COLUMN "name" varchar(255);
UPDATE "identity"."users" SET "name" = CONCAT(COALESCE("first_name", ''), ' ', COALESCE("last_name", '')) WHERE "name" IS NULL;

ALTER TABLE "identity"."users" DROP COLUMN "first_name";
ALTER TABLE "identity"."users" DROP COLUMN "last_name";
