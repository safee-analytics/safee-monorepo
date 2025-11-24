import {
  varchar,
  timestamp,
  uuid,
  integer,
  boolean,
  text,
  date,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { hrSchema, idpk, employeeTypeEnum, genderEnum, maritalStatusEnum } from "./_common.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const hrEmployees = hrSchema.table("employees", {
  id: idpk("id"),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),

  odooEmployeeId: integer("odoo_employee_id"), // Maps to Odoo hr.employee ID
  odooUserId: integer("odoo_user_id"), // Maps to Odoo res.users ID

  userId: uuid("user_id").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),

  employeeNumber: varchar("employee_number", { length: 50 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),

  jobTitle: varchar("job_title", { length: 255 }),
  departmentId: uuid("department_id"),
  managerId: uuid("manager_id").references((): AnyPgColumn => hrEmployees.id),
  workLocation: varchar("work_location", { length: 255 }),
  workEmail: varchar("work_email", { length: 255 }),
  workPhone: varchar("work_phone", { length: 50 }),
  employeeType: employeeTypeEnum("employee_type").default("employee"),

  gender: genderEnum("gender"),
  maritalStatus: maritalStatusEnum("marital_status"),
  birthday: date("birthday"),
  placeOfBirth: varchar("place_of_birth", { length: 255 }),
  countryOfBirth: varchar("country_of_birth", { length: 2 }),
  nationality: varchar("nationality", { length: 2 }),
  identificationId: varchar("identification_id", { length: 100 }),
  passportId: varchar("passport_id", { length: 100 }),

  bankAccountNumber: varchar("bank_account_number", { length: 100 }),
  bankName: varchar("bank_name", { length: 255 }),
  bankIban: varchar("bank_iban", { length: 100 }),

  emergencyContact: varchar("emergency_contact", { length: 255 }),
  emergencyPhone: varchar("emergency_phone", { length: 50 }),
  emergencyRelation: varchar("emergency_relation", { length: 100 }),

  hireDate: date("hire_date"),
  terminationDate: date("termination_date"),
  contractId: uuid("contract_id"),

  photoUrl: varchar("photo_url", { length: 512 }),
  notes: text("notes"),

  active: boolean("active").default(true).notNull(),

  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
