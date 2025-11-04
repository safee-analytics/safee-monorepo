import { varchar, timestamp, uuid, jsonb, boolean } from "drizzle-orm/pg-core";
import { identitySchema } from "./_common.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const connectorTypeEnum = identitySchema.enum("connector_type", [
  "postgresql",
  "mysql",
  "mssql",
  "storage_local",
  "storage_webdav",
  "storage_smb",
  "storage_cloud",
]);

export const connectionStatusEnum = identitySchema.enum("connection_status", [
  "success",
  "failed",
  "untested",
]);

export const connectors = identitySchema.table("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),

  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null", onUpdate: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  type: connectorTypeEnum("type").notNull(),

  config: jsonb("config").notNull().$type<{
    host?: string;
    port?: number;
    database?: string;
    username?: string;
    password?: string;
    ssl?: boolean;
    url?: string;
    apiKey?: string;
    authToken?: string;
    [key: string]: unknown;
  }>(),

  isActive: boolean("is_active").notNull().default(true),
  lastConnectionTest: timestamp("last_connection_test", { withTimezone: true }),
  lastConnectionStatus: connectionStatusEnum("last_connection_status").default("untested"),
  lastConnectionError: varchar("last_connection_error", { length: 1000 }),

  tags: jsonb("tags").$type<string[]>().default([]),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
