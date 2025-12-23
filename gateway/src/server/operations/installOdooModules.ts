import { odoo } from "@safee/database";
import type { ServerContext } from "../serverContext.js";
import { ODOO_URL, ODOO_PORT, ODOO_ADMIN_PASSWORD, JWT_SECRET } from "../../env.js";

export async function installOdooModules(
  organizationId: string,
  ctx: ServerContext,
): Promise<{ success: boolean; message: string }> {
  try {
    const odooDatabaseService = new odoo.OdooDatabaseService({
      logger: ctx.logger,
      drizzle: ctx.drizzle,
      redis: ctx.redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });
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
