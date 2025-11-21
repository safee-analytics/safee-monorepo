import type { DrizzleClient } from "@safee/database";
import { getOdooAdminCredentials } from "./getOdooAdminCredentials.js";
import { createOdooClient } from "../services/odoo/client.service.js";
import { getServerContext } from "../serverContext.js";

interface OdooUser {
  id: number;
  name: string;
  login: string;
  email: string;
  active: boolean;
  group_ids: number[];
}

interface OdooGroup {
  id: number;
  name: string;
  full_name: string;
  user_ids: number[];
}

interface OdooModule {
  id: number;
  name: string;
  display_name: string;
  state: string;
  summary: string;
}

export async function getOdooDatabaseInfo(
  drizzle: DrizzleClient,
  organizationId: string,
): Promise<{
  database: {
    name: string;
    exists: boolean;
    loginUrl: string;
  };
  users: Array<{
    id: number;
    name: string;
    login: string;
    email: string;
    active: boolean;
    groups: Array<{
      id: number;
      name: string;
      fullName: string;
    }>;
  }>;
  modules: Array<{
    id: number;
    name: string;
    displayName: string;
    state: string;
    summary: string;
  }>;
  accessGroups: Array<{
    id: number;
    name: string;
    fullName: string;
    category: string;
    users: number[];
  }>;
}> {
  const logger = getServerContext().logger.child({ operation: "getOdooDatabaseInfo", organizationId });

  const credentials = await getOdooAdminCredentials(drizzle, organizationId);

  if (!credentials) {
    throw new Error("Odoo database not found for organization");
  }

  const odooUrl = process.env.ODOO_URL || "http://localhost:8069";
  const odooPort = parseInt(process.env.ODOO_PORT || "8069", 10);

  const client = createOdooClient(
    {
      url: odooUrl,
      port: odooPort,
      database: credentials.databaseName,
      username: credentials.adminLogin,
      password: credentials.adminPassword,
    },
    logger,
  );

  await client.authenticate();

  logger.info({ database: credentials.databaseName }, "Fetching comprehensive database info");

  const odooUsers = await client.searchRead<OdooUser>(
    "res.users",
    [],
    ["id", "name", "login", "email", "active", "group_ids"],
  );

  const odooGroups = await client.searchRead<OdooGroup>(
    "res.groups",
    [],
    ["id", "name", "full_name", "user_ids"],
  );

  const installedModules = await client.searchRead<OdooModule>(
    "ir.module.module",
    [["state", "=", "installed"]],
    ["id", "name", "display_name", "state", "summary"],
  );

  const groupsMap = new Map(odooGroups.map((g) => [g.id, g]));

  const users = odooUsers.map((user) => ({
    id: user.id,
    name: user.name,
    login: user.login,
    email: user.email || user.login,
    active: user.active,
    groups: (user.group_ids || []).map((groupId) => {
      const group = groupsMap.get(groupId);
      return {
        id: groupId,
        name: group?.name || "Unknown",
        fullName: group?.full_name || "Unknown",
      };
    }),
  }));

  const accessGroups = odooGroups.map((group) => ({
    id: group.id,
    name: group.name,
    fullName: group.full_name,
    category: "Access Rights",
    users: group.user_ids || [],
  }));

  const modules = installedModules.map((module) => ({
    id: module.id,
    name: module.name,
    displayName: module.display_name,
    state: module.state,
    summary: module.summary || "",
  }));

  logger.info(
    {
      database: credentials.databaseName,
      userCount: users.length,
      moduleCount: modules.length,
      groupCount: accessGroups.length,
    },
    "Database info fetched successfully",
  );

  return {
    database: {
      name: credentials.databaseName,
      exists: true,
      loginUrl: `${odooUrl}/web/login?db=${credentials.databaseName}`,
    },
    users,
    modules,
    accessGroups,
  };
}
