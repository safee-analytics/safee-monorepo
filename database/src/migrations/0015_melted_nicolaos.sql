/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'identity'
                AND table_name = 'team_members'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "team_members" DROP CONSTRAINT "<constraint_name>";
ALTER TABLE "identity"."odoo_users" ADD COLUMN "odoo_web_password" varchar(512);