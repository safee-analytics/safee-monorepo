import { NotFound } from "../../errors.js";
import { createOdooClient, type OdooClient, type OdooConnectionConfig } from "./client.service.js";
import type { Logger } from "pino";

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
}

export interface OdooModuleUninstallParams {
  config: OdooConnectionConfig;
  modules: string[];
  logger: Logger;
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
    const { config, modules, logger } = params;

    const client = createOdooClient(config, logger);
    await client.authenticate();

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    const moduleIds = moduleRecords.map((m) => m.id);

    await client.execute<void>("ir.module.module", "button_immediate_install", [moduleIds], {
      context: { lang: "en_US" },
    });

    logger.info({ modules, database: config.database }, "Installed Odoo modules");
  }

  async uninstallModules(params: OdooModuleUninstallParams): Promise<void> {
    const { config, modules, logger } = params;

    const client = createOdooClient(config, logger);
    await client.authenticate();

    const moduleRecords = await this.getModulesByName(client, modules);

    if (moduleRecords.length === 0) {
      throw new NotFound(`No modules found with names: ${modules.join(", ")}`);
    }

    const moduleIds = moduleRecords.map((m) => m.id);

    await client.execute<void>("ir.module.module", "button_immediate_uninstall", [moduleIds], {
      context: { lang: "en_US" },
    });

    logger.info({ modules, database: config.database }, "Uninstalled Odoo modules");
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
