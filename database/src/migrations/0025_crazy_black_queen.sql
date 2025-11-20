ALTER TABLE "identity"."odoo_databases" SET SCHEMA "odoo";

ALTER TABLE "identity"."odoo_users" SET SCHEMA "odoo";

ALTER TABLE "identity"."odoo_audit_logs" SET SCHEMA "odoo";

ALTER TABLE "identity"."odoo_idempotency_keys" SET SCHEMA "odoo";

ALTER TABLE "odoo"."odoo_databases" RENAME TO "databases";
ALTER TABLE "odoo"."odoo_users" RENAME TO "users";
ALTER TABLE "odoo"."odoo_audit_logs" RENAME TO "audit_logs";
ALTER TABLE "odoo"."odoo_idempotency_keys" RENAME TO "idempotency_keys";
ALTER TABLE "odoo"."databases" DROP CONSTRAINT "odoo_databases_organization_id_unique";
ALTER TABLE "odoo"."databases" DROP CONSTRAINT "odoo_databases_database_name_unique";
ALTER TABLE "odoo"."audit_logs" DROP CONSTRAINT "odoo_audit_logs_operation_id_unique";
ALTER TABLE "odoo"."idempotency_keys" DROP CONSTRAINT "odoo_idempotency_keys_idempotency_key_unique";
ALTER TABLE "odoo"."databases" DROP CONSTRAINT "odoo_databases_organization_id_organizations_id_fk";

ALTER TABLE "odoo"."users" DROP CONSTRAINT "odoo_users_user_id_users_id_fk";

ALTER TABLE "odoo"."users" DROP CONSTRAINT "odoo_users_odoo_database_id_odoo_databases_id_fk";

ALTER TABLE "odoo"."audit_logs" DROP CONSTRAINT "odoo_audit_logs_user_id_users_id_fk";

ALTER TABLE "odoo"."audit_logs" DROP CONSTRAINT "odoo_audit_logs_organization_id_organizations_id_fk";

ALTER TABLE "odoo"."idempotency_keys" DROP CONSTRAINT "odoo_idempotency_keys_user_id_users_id_fk";

ALTER TABLE "odoo"."idempotency_keys" DROP CONSTRAINT "odoo_idempotency_keys_organization_id_organizations_id_fk";

ALTER TABLE "odoo"."databases" ADD CONSTRAINT "databases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "odoo"."users" ADD CONSTRAINT "users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "odoo"."users" ADD CONSTRAINT "users_odoo_database_id_databases_id_fk" FOREIGN KEY ("odoo_database_id") REFERENCES "odoo"."databases"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "odoo"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "odoo"."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "odoo"."idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "odoo"."idempotency_keys" ADD CONSTRAINT "idempotency_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "odoo"."databases" ADD CONSTRAINT "databases_organization_id_unique" UNIQUE("organization_id");
ALTER TABLE "odoo"."databases" ADD CONSTRAINT "databases_database_name_unique" UNIQUE("database_name");
ALTER TABLE "odoo"."audit_logs" ADD CONSTRAINT "audit_logs_operation_id_unique" UNIQUE("operation_id");
ALTER TABLE "odoo"."idempotency_keys" ADD CONSTRAINT "idempotency_keys_idempotency_key_unique" UNIQUE("idempotency_key");