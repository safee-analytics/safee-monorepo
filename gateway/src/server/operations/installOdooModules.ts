import { OdooDatabaseService } from "../services/odoo/database.service.js";
import type { ServerContext } from "../serverContext.js";

export async function installOdooModules(
  organizationId: string,
  ctx: ServerContext,
): Promise<{ success: boolean; message: string }> {
  try {
    const odooDatabaseService = new OdooDatabaseService(ctx);
    await odooDatabaseService.installModulesForOrganization(organizationId);
    ctx.logger.info({ organizationId }, "Odoo modules installed successfully");

    return {
      success: true,
      message: "Odoo modules installed successfully",
    };
  } catch (error) {
    ctx.logger.error({ organizationId, error }, "Failed to install Odoo modules");
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to install modules",
    };
  }
}
