import { type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import { createResilientOdooClient } from "./resilient-client.js";
import type { DrizzleClient } from "@safee/database";
import type { Logger } from "pino";
import { NotFound } from "./errors.js";

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
  organizationId?: string;
  userId?: string;
}

export interface OdooModuleUninstallParams {
  config: OdooConnectionConfig;
  modules: string[];
  organizationId?: string;
  userId?: string;
}

interface OdooModuleServiceDependencies {
  logger: Logger;
  drizzle: DrizzleClient;
}

export class OdooModuleService {
  private readonly deps: OdooModuleServiceDependencies;

  constructor(deps: OdooModuleServiceDependencies) {
    this.deps = deps;
  }

  private get logger() {
    return this.deps.logger;
  }

  private get drizzle() {
    return this.deps.drizzle;
  }
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

  private async clearStuckModuleOperations(client: OdooClient): Promise<void> {
    try {
      const stuckModules = await client.searchRead<OdooModule>(
        "ir.module.module",
        ["|", "|", ["state", "=", "to install"], ["state", "=", "to upgrade"], ["state", "=", "to remove"]],
        ["id", "name", "state"],
        {},
        { lang: "en_US" },
      );

      if (stuckModules.length > 0) {
        this.logger.warn(
          { stuckModules: stuckModules.map((m) => ({ name: m.name, state: m.state })) },
          "Found stuck module operations, clearing them",
        );

        for (const module of stuckModules) {
          try {
            const newState =
              module.state === "to install" || module.state === "to remove" ? "uninstalled" : "installed";

            await client.write("ir.module.module", [module.id], { state: newState }, { lang: "en_US" });

            this.logger.info(
              { moduleName: module.name, oldState: module.state, newState },
              "Cleared stuck module state",
            );
          } catch (err) {
            this.logger.warn(
              { moduleName: module.name, error: err instanceof Error ? err.message : "Unknown" },
              "Failed to clear stuck module, continuing anyway",
            );
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      this.logger.warn(
        { error: err instanceof Error ? err.message : "Unknown" },
        "Failed to check for stuck modules, continuing anyway",
      );
    }
  }

  async installModules(params: OdooModuleInstallParams): Promise<void> {
    const { config, modules, organizationId, userId: _userId } = params;

    const client = createResilientOdooClient(config, this.logger, this.drizzle);
    await client.authenticate();

    this.logger.info({ modules, database: config.database, organizationId }, "Starting module installation");

    await this.clearStuckModuleOperations(client);

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    const modulesToInstall = moduleRecords.filter((m) => m.state !== "installed");
    const alreadyInstalled = moduleRecords.filter((m) => m.state === "installed");

    if (alreadyInstalled.length > 0) {
      this.logger.info(
        {
          modules: alreadyInstalled.map((m) => m.name),
          database: config.database,
        },
        "Modules already installed, skipping",
      );
    }

    if (modulesToInstall.length === 0) {
      this.logger.info({ modules, database: config.database }, "All modules already installed");
      return;
    }

    const moduleIds = modulesToInstall.map((m) => m.id);
    const moduleNames = modulesToInstall.map((m) => m.name);

    this.logger.info(
      {
        modulesToInstall: moduleNames,
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
        await client.execute<undefined>("ir.module.module", "button_immediate_install", [moduleIds], {
          context: { lang: "en_US" },
        });

        this.logger.info(
          {
            installed: moduleNames,
            database: config.database,
            organizationId,
          },
          "✅ Odoo modules installed successfully",
        );

        return;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);

        if (
          errorMessage.includes("another module operation") ||
          errorMessage.includes("processing another")
        ) {
          retries++;

          if (retries <= maxRetries) {
            const delay = baseDelay * Math.pow(2, retries - 1); // Exponential backoff
            this.logger.warn(
              { retries, maxRetries, delay, error: errorMessage },
              "Another module operation in progress, retrying after delay",
            );

            await new Promise((resolve) => setTimeout(resolve, delay));

            await this.clearStuckModuleOperations(client);
          } else {
            this.logger.error(
              { retries, error: errorMessage },
              "Max retries reached, module operation still in progress",
            );
            throw new Error("Odoo is busy with another module operation. Please try again in a few moments.");
          }
        } else {
          // Installation failed with real error
          this.logger.error(
            { modules: moduleNames, database: config.database, error: errorMessage },
            "❌ Module installation failed",
          );

          // Note: Odoo's button_immediate_install is atomic - either all modules install or none do
          // If it fails, modules remain uninstalled, so no rollback needed
          // However, we should clear any stuck states
          try {
            await this.clearStuckModuleOperations(client);
          } catch (cleanupErr) {
            this.logger.warn(
              { error: cleanupErr instanceof Error ? cleanupErr.message : "Unknown" },
              "Failed to clear stuck modules after installation error",
            );
          }

          throw err;
        }
      }
    }
  }

  async uninstallModules(params: OdooModuleUninstallParams): Promise<void> {
    const { config, modules, organizationId, userId: _userId } = params;

    const client = createResilientOdooClient(config, this.logger, this.drizzle);
    await client.authenticate();

    this.logger.info(
      { modules, database: config.database, organizationId },
      "Starting module uninstallation",
    );

    await this.clearStuckModuleOperations(client);

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    const modulesToUninstall = moduleRecords.filter((m) => m.state === "installed");
    const notInstalled = moduleRecords.filter((m) => m.state !== "installed");

    if (notInstalled.length > 0) {
      this.logger.info(
        {
          modules: notInstalled.map((m) => m.name),
          database: config.database,
        },
        "Modules not installed, skipping",
      );
    }

    if (modulesToUninstall.length === 0) {
      this.logger.info({ modules, database: config.database }, "No modules to uninstall");
      return;
    }

    const moduleIds = modulesToUninstall.map((m) => m.id);
    const moduleNames = modulesToUninstall.map((m) => m.name);

    this.logger.info(
      {
        modulesToUninstall: moduleNames,
        moduleIds,
        database: config.database,
      },
      "Uninstalling modules",
    );

    try {
      await client.execute<undefined>("ir.module.module", "button_immediate_uninstall", [moduleIds], {
        context: { lang: "en_US" },
      });

      this.logger.info(
        {
          uninstalled: moduleNames,
          database: config.database,
          organizationId,
        },
        "✅ Odoo modules uninstalled successfully",
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      this.logger.error(
        { modules: moduleNames, database: config.database, error: errorMessage },
        "❌ Module uninstallation failed",
      );

      // Note: Odoo's button_immediate_uninstall is atomic - either all modules uninstall or none do
      // If it fails, modules remain installed, so no rollback needed
      // However, we should clear any stuck states
      try {
        await this.clearStuckModuleOperations(client);
      } catch (cleanupErr) {
        this.logger.warn(
          { error: cleanupErr instanceof Error ? cleanupErr.message : "Unknown" },
          "Failed to clear stuck modules after uninstallation error",
        );
      }

      throw err;
    }
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
