import { OdooDatabaseService } from "../services/odoo/database.service.js";
import type { Logger } from "pino";
import type { DrizzleClient } from "@safee/database";

export async function installOdooModules(
  organizationId: string,
  logger: Logger,
  drizzle: DrizzleClient,
): Promise<{ success: boolean; message: string }> {
  try {
    const odooDatabaseService = new OdooDatabaseService(drizzle);
    await odooDatabaseService.installModulesForOrganization(organizationId);
    logger.info({ organizationId }, "Odoo modules installed successfully");

    return {
      success: true,
      message: "Odoo modules installed successfully",
    };
  } catch (error) {
    logger.error({ organizationId, error }, "Failed to install Odoo modules");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to install modules",
    };
  }
}
