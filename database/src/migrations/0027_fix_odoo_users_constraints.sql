-- Fix odoo_users column constraints
-- api_key should be nullable (it's optional, password is the fallback)
-- password should be NOT NULL (it's required as the fallback auth method)

ALTER TABLE "odoo"."odoo_users" ALTER COLUMN "api_key" DROP NOT NULL;
ALTER TABLE "odoo"."odoo_users" ALTER COLUMN "password" SET NOT NULL;
