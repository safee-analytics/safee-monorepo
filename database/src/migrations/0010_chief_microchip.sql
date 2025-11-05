ALTER TYPE "identity"."connector_type" ADD VALUE 'storage_cloud';
CREATE TABLE "identity"."members" (
	"id" uuid  DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_organization_id_user_id_pk" PRIMARY KEY("organization_id","user_id")
);

CREATE TABLE "identity"."invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"inviter_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DROP TABLE "identity"."roles" CASCADE;
DROP TABLE "identity"."permissions" CASCADE;
DROP TABLE "identity"."role_permissions" CASCADE;
DROP TABLE "identity"."user_roles" CASCADE;
ALTER TABLE "identity"."organizations" ADD COLUMN "logo" text;
ALTER TABLE "identity"."organizations" ADD COLUMN "metadata" text;
ALTER TABLE "identity"."users" ADD COLUMN "role" varchar(50) DEFAULT 'user' NOT NULL;
ALTER TABLE "identity"."members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
