import { relations } from "drizzle-orm";
import { permissions } from "./permissions.js";
import { rolePermissions } from "./rolePermissions.js";

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));
