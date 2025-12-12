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
  } catch (err) {
    ctx.logger.error({ organizationId, error: err }, "Failed to install Odoo modules");
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to install modules",
    };
  }
}
