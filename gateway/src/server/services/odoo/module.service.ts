import { NotFound } from "../../errors.js";
import { type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import { createResilientOdooClient } from "./resilient-client.js";
import type { Logger } from "pino";
import type { DrizzleClient } from "@safee/database";

export interface OdooModule {
  id: number;
  name: string;
  display_name: string;
  summary: string;
  description: string;
  state: "uninstalled" | "installed" | "to upgrade" | "to remove" | "to install";
  category_id: [number, string];
  icon: string;
}

export interface OdooModuleInstallParams {
  config: OdooConnectionConfig;
  modules: string[];
  logger: Logger;
  drizzle: DrizzleClient;
  organizationId?: string;
  userId?: string;
}

export interface OdooModuleUninstallParams {
  config: OdooConnectionConfig;
  modules: string[];
  logger: Logger;
  drizzle: DrizzleClient;
  organizationId?: string;
  userId?: string;
}

export class OdooModuleService {
  async getAvailableModules(client: OdooClient): Promise<OdooModule[]> {
    return await client.searchRead<OdooModule>(
      "ir.module.module",
      [], // Empty domain to get all modules
      ["name", "display_name", "summary", "description", "state", "category_id", "icon"],
      {},
      { lang: "en_US" },
    );
  }

  async getInstalledModules(client: OdooClient): Promise<OdooModule[]> {
    return await client.searchRead<OdooModule>(
      "ir.module.module",
      [["state", "=", "installed"]], // Only installed modules
      ["name", "display_name", "summary", "description", "state", "category_id", "icon"],
      {},
      { lang: "en_US" },
    );
  }

  async installModules(params: OdooModuleInstallParams): Promise<void> {
    const { config, modules, logger, drizzle, organizationId, userId } = params;

    // Use resilient client with retry, circuit breaker, and audit logging
    const client = createResilientOdooClient(config, logger, drizzle);
    await client.authenticate();

    logger.info({ modules, database: config.database, organizationId }, "Starting module installation");

    // First check which modules are already installed
    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    // Filter out already installed modules
    const modulesToInstall = moduleRecords.filter((m) => m.state !== "installed");
    const alreadyInstalled = moduleRecords.filter((m) => m.state === "installed");

    if (alreadyInstalled.length > 0) {
      logger.info(
        {
          modules: alreadyInstalled.map((m) => m.name),
          database: config.database,
        },
        "Modules already installed, skipping",
      );
    }

    if (modulesToInstall.length === 0) {
      logger.info({ modules, database: config.database }, "All modules already installed");
      return;
    }

    const moduleIds = modulesToInstall.map((m) => m.id);

    logger.info(
      {
        modulesToInstall: modulesToInstall.map((m) => m.name),
        moduleIds,
        database: config.database,
      },
      "Installing modules",
    );

    // Use execute from resilient client which has retry + circuit breaker
    await client.execute<void>("ir.module.module", "button_immediate_install", [moduleIds], {
      context: { lang: "en_US" },
    });

    logger.info(
      {
        installed: modulesToInstall.map((m) => m.name),
        database: config.database,
        organizationId,
      },
      "✅ Odoo modules installed successfully",
    );
  }

  async uninstallModules(params: OdooModuleUninstallParams): Promise<void> {
    const { config, modules, logger, drizzle, organizationId, userId } = params;

    // Use resilient client with retry, circuit breaker, and audit logging
    const client = createResilientOdooClient(config, logger, drizzle);
    await client.authenticate();

    logger.info({ modules, database: config.database, organizationId }, "Starting module uninstallation");

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    // Filter only installed modules
    const modulesToUninstall = moduleRecords.filter((m) => m.state === "installed");
    const notInstalled = moduleRecords.filter((m) => m.state !== "installed");

    if (notInstalled.length > 0) {
      logger.info(
        {
          modules: notInstalled.map((m) => m.name),
          database: config.database,
        },
        "Modules not installed, skipping",
      );
    }

    if (modulesToUninstall.length === 0) {
      logger.info({ modules, database: config.database }, "No modules to uninstall");
      return;
    }

    const moduleIds = modulesToUninstall.map((m) => m.id);

    logger.info(
      {
        modulesToUninstall: modulesToUninstall.map((m) => m.name),
        moduleIds,
        database: config.database,
      },
      "Uninstalling modules",
    );

    await client.execute<void>("ir.module.module", "button_immediate_uninstall", [moduleIds], {
      context: { lang: "en_US" },
    });

    logger.info(
      {
        uninstalled: modulesToUninstall.map((m) => m.name),
        database: config.database,
        organizationId,
      },
      "✅ Odoo modules uninstalled successfully",
    );
  }

  private async getModulesByName(client: OdooClient, moduleNames: string[]): Promise<OdooModule[]> {
    return await client.searchRead<OdooModule>(
      "ir.module.module",
      [["name", "in", moduleNames]],
      ["id", "name", "display_name", "state"],
      {},
      { lang: "en_US" },
    );
  }
}

export const odooModuleService = new OdooModuleService();
