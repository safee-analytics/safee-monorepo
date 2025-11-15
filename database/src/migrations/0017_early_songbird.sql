ALTER TABLE "audit"."cases" DROP CONSTRAINT "cases_case_number_unique";
ALTER TABLE "audit"."cases" ADD CONSTRAINT "cases_org_case_number_unique" UNIQUE("organization_id","case_number");