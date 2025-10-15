-- Migration: remove-job-definitions-use-job-name
-- Remove jobDefinitions table and replace foreign keys with jobName enum

-- Create the job_name enum
CREATE TYPE "jobs"."job_name" AS ENUM('send_email');

-- Drop the job_definitions table (CASCADE will drop foreign keys)
DROP TABLE IF EXISTS "jobs"."job_definitions" CASCADE;

-- Drop old indexes on job_schedules
DROP INDEX IF EXISTS "jobs"."job_schedules_definition_idx";

-- Drop old indexes on jobs
DROP INDEX IF EXISTS "jobs"."jobs_definition_idx";

-- Add job_name column to job_schedules
ALTER TABLE "jobs"."job_schedules" ADD COLUMN "job_name" "jobs"."job_name";

-- Add job_name column to jobs
ALTER TABLE "jobs"."jobs" ADD COLUMN "job_name" "jobs"."job_name";

-- Update existing records (if any) to use 'send_email' as default
UPDATE "jobs"."job_schedules" SET "job_name" = 'send_email' WHERE "job_name" IS NULL;
UPDATE "jobs"."jobs" SET "job_name" = 'send_email' WHERE "job_name" IS NULL;

-- Make job_name NOT NULL
ALTER TABLE "jobs"."job_schedules" ALTER COLUMN "job_name" SET NOT NULL;
ALTER TABLE "jobs"."jobs" ALTER COLUMN "job_name" SET NOT NULL;

-- Create new indexes
CREATE INDEX "job_schedules_job_name_idx" ON "jobs"."job_schedules" USING btree ("job_name");
CREATE INDEX "jobs_job_name_idx" ON "jobs"."jobs" USING btree ("job_name");

-- Drop old job_definition_id columns
ALTER TABLE "jobs"."job_schedules" DROP COLUMN IF EXISTS "job_definition_id";
ALTER TABLE "jobs"."jobs" DROP COLUMN IF EXISTS "job_definition_id";
