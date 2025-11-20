ALTER TABLE "odoo"."users" RENAME TO "odoo_users";
ALTER TABLE "odoo"."odoo_users" DROP CONSTRAINT "users_user_id_users_id_fk";

ALTER TABLE "odoo"."odoo_users" DROP CONSTRAINT "users_odoo_database_id_databases_id_fk";

ALTER TABLE "odoo"."odoo_users" ADD CONSTRAINT "odoo_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE cascade ON UPDATE cascade;
ALTER TABLE "odoo"."odoo_users" ADD CONSTRAINT "odoo_users_odoo_database_id_databases_id_fk" FOREIGN KEY ("odoo_database_id") REFERENCES "odoo"."databases"("id") ON DELETE cascade ON UPDATE cascade;