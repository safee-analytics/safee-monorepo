ALTER TABLE "system"."notifications" ADD COLUMN "deleted_at" timestamp with time zone;
CREATE INDEX "notifications_deleted_at_idx" ON "system"."notifications" USING btree ("deleted_at");