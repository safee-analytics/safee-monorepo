CREATE TABLE "system"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"related_entity_type" varchar(50),
	"related_entity_id" uuid,
	"action_label" varchar(100),
	"action_url" varchar(500),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "system"."notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "system"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
CREATE INDEX "notifications_user_id_idx" ON "system"."notifications" USING btree ("user_id");
CREATE INDEX "notifications_org_id_idx" ON "system"."notifications" USING btree ("organization_id");
CREATE INDEX "notifications_created_at_idx" ON "system"."notifications" USING btree ("created_at");
CREATE INDEX "notifications_is_read_idx" ON "system"."notifications" USING btree ("is_read");