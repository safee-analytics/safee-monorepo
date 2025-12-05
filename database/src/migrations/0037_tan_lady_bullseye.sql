ALTER TYPE "jobs"."job_name" ADD VALUE 'encrypt_file';
ALTER TYPE "jobs"."job_name" ADD VALUE 'rotate_encryption_key';
ALTER TYPE "jobs"."job_name" ADD VALUE 'reencrypt_files';
CREATE TABLE "identity"."encryption_keys" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"wrapped_org_key" text NOT NULL,
	"salt" text NOT NULL,
	"iv" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"algorithm" text DEFAULT 'AES-256-GCM' NOT NULL,
	"derivation_params" jsonb DEFAULT '{"iterations":600000,"hash":"SHA-256","keyLength":32}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);

CREATE TABLE "identity"."user_keypairs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"user_id" uuid NOT NULL,
	"public_key" text NOT NULL,
	"encrypted_private_key" text NOT NULL,
	"private_key_salt" text NOT NULL,
	"private_key_iv" text NOT NULL,
	"algorithm" text DEFAULT 'RSA-OAEP-4096' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "user_keypairs_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "identity"."auditor_access" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"organization_id" uuid NOT NULL,
	"auditor_user_id" uuid NOT NULL,
	"granted_by_user_id" uuid NOT NULL,
	"encryption_key_id" uuid NOT NULL,
	"wrapped_org_key" text NOT NULL,
	"expires_at" timestamp with time zone,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by_user_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "identity"."file_encryption_metadata" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"file_id" uuid NOT NULL,
	"encryption_key_id" uuid NOT NULL,
	"key_version" integer NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"algorithm" text DEFAULT 'AES-256-GCM' NOT NULL,
	"chunk_size" integer DEFAULT 131072 NOT NULL,
	"is_encrypted" boolean DEFAULT true NOT NULL,
	"encrypted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"encrypted_by" uuid NOT NULL,
	CONSTRAINT "file_encryption_metadata_file_id_unique" UNIQUE("file_id")
);

ALTER TABLE "identity"."invitations" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE "identity"."invitations" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
DROP TYPE "identity"."invitation_status";
CREATE TYPE "identity"."invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'expired', 'canceled');
ALTER TABLE "identity"."invitations" ALTER COLUMN "status" SET DEFAULT 'pending'::"identity"."invitation_status";
ALTER TABLE "identity"."invitations" ALTER COLUMN "status" SET DATA TYPE "identity"."invitation_status" USING "status"::"identity"."invitation_status";
ALTER TABLE "identity"."organizations" ADD COLUMN "encryption_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "identity"."organizations" ADD COLUMN "encryption_enabled_at" timestamp with time zone;
ALTER TABLE "identity"."organizations" ADD COLUMN "encryption_enabled_by" uuid;
ALTER TABLE "identity"."encryption_keys" ADD CONSTRAINT "encryption_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."user_keypairs" ADD CONSTRAINT "user_keypairs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."auditor_access" ADD CONSTRAINT "auditor_access_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."auditor_access" ADD CONSTRAINT "auditor_access_auditor_user_id_users_id_fk" FOREIGN KEY ("auditor_user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."auditor_access" ADD CONSTRAINT "auditor_access_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."auditor_access" ADD CONSTRAINT "auditor_access_encryption_key_id_encryption_keys_id_fk" FOREIGN KEY ("encryption_key_id") REFERENCES "identity"."encryption_keys"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "identity"."auditor_access" ADD CONSTRAINT "auditor_access_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE cascade;
ALTER TABLE "identity"."file_encryption_metadata" ADD CONSTRAINT "file_encryption_metadata_encryption_key_id_encryption_keys_id_fk" FOREIGN KEY ("encryption_key_id") REFERENCES "identity"."encryption_keys"("id") ON DELETE restrict ON UPDATE cascade;
CREATE INDEX "encryption_keys_org_idx" ON "identity"."encryption_keys" USING btree ("organization_id");
CREATE INDEX "encryption_keys_active_idx" ON "identity"."encryption_keys" USING btree ("is_active");
CREATE INDEX "user_keypairs_user_idx" ON "identity"."user_keypairs" USING btree ("user_id");
CREATE INDEX "auditor_access_org_idx" ON "identity"."auditor_access" USING btree ("organization_id");
CREATE INDEX "auditor_access_auditor_idx" ON "identity"."auditor_access" USING btree ("auditor_user_id");
CREATE INDEX "auditor_access_revoked_idx" ON "identity"."auditor_access" USING btree ("is_revoked");
CREATE INDEX "file_enc_metadata_file_idx" ON "identity"."file_encryption_metadata" USING btree ("file_id");
CREATE INDEX "file_enc_metadata_key_idx" ON "identity"."file_encryption_metadata" USING btree ("encryption_key_id");