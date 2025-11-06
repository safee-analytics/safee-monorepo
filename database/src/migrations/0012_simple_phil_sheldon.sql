ALTER TABLE "identity"."users" ADD COLUMN "phone" varchar(50);
ALTER TABLE "identity"."users" ADD COLUMN "job_title" varchar(255);
ALTER TABLE "identity"."users" ADD COLUMN "department" varchar(255);
ALTER TABLE "identity"."users" ADD COLUMN "company" varchar(255);
ALTER TABLE "identity"."users" ADD COLUMN "location" varchar(255);
ALTER TABLE "identity"."users" ADD COLUMN "bio" text;
ALTER TABLE "identity"."users" ADD COLUMN "timezone" varchar(100) DEFAULT 'UTC';
ALTER TABLE "identity"."users" ADD COLUMN "date_format" varchar(50) DEFAULT 'DD/MM/YYYY';