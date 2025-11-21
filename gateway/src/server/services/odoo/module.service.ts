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

  private async clearStuckModuleOperations(client: OdooClient, logger: Logger): Promise<void> {
    try {
      const stuckModules = await client.searchRead<OdooModule>(
        "ir.module.module",
        ["|", "|", ["state", "=", "to install"], ["state", "=", "to upgrade"], ["state", "=", "to remove"]],
        ["id", "name", "state"],
        {},
        { lang: "en_US" },
      );

      if (stuckModules.length > 0) {
        logger.warn(
          { stuckModules: stuckModules.map((m) => ({ name: m.name, state: m.state })) },
          "Found stuck module operations, clearing them",
        );

        for (const module of stuckModules) {
          try {
            const newState =
              module.state === "to install" || module.state === "to remove" ? "uninstalled" : "installed";

            await client.write("ir.module.module", [module.id], { state: newState }, { lang: "en_US" });

            logger.info(
              { moduleName: module.name, oldState: module.state, newState },
              "Cleared stuck module state",
            );
          } catch (error) {
            logger.warn(
              { moduleName: module.name, error: error instanceof Error ? error.message : "Unknown" },
              "Failed to clear stuck module, continuing anyway",
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : "Unknown" },
        "Failed to check for stuck modules, continuing anyway",
      );
    }
  }

  async installModules(params: OdooModuleInstallParams): Promise<void> {
    const { config, modules, logger, drizzle, organizationId, userId: _userId } = params;

    const client = createResilientOdooClient(config, logger, drizzle);
    await client.authenticate();

    logger.info({ modules, database: config.database, organizationId }, "Starting module installation");

    await this.clearStuckModuleOperations(client, logger);

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

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

    let retries = 0;
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    while (retries <= maxRetries) {
      try {
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

        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("another module operation") ||
          errorMessage.includes("processing another")
        ) {
          retries++;

          if (retries <= maxRetries) {
            const delay = baseDelay * Math.pow(2, retries - 1); // Exponential backoff
            logger.warn(
              { retries, maxRetries, delay, error: errorMessage },
              "Another module operation in progress, retrying after delay",
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

            await this.clearStuckModuleOperations(client, logger);
          } else {
            logger.error(
              { retries, error: errorMessage },
              "Max retries reached, module operation still in progress",
            );
            throw new Error("Odoo is busy with another module operation. Please try again in a few moments.");
          }
        } else {
          throw error;
        }
      }
    }
  }

  async uninstallModules(params: OdooModuleUninstallParams): Promise<void> {
    const { config, modules, logger, drizzle, organizationId, userId: _userId } = params;

    const client = createResilientOdooClient(config, logger, drizzle);
    await client.authenticate();

    logger.info({ modules, database: config.database, organizationId }, "Starting module uninstallation");

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

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
