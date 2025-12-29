CREATE TYPE "odoo"."provisioning_status" AS ENUM('pending', 'provisioning', 'active', 'failed');
ALTER TYPE "jobs"."job_name" ADD VALUE 'odoo_provision_organization';
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_status" "odoo"."provisioning_status" DEFAULT 'pending' NOT NULL;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_error" text;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_started_at" timestamp with time zone;
ALTER TABLE "odoo"."databases" ADD COLUMN "provisioning_completed_at" timestamp with time zone;