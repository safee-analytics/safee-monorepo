import type { Logger } from "pino";
import { getOdooClientManager } from "./manager.service.js";

export interface OdooWebhookConfig {
  webhooksEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  organizationId: string;
}

/**
 * Configure Odoo webhook settings for an organization
 * This runs automatically when an organization is created
 */
export async function configureOdooWebhooks(
  logger: Logger,
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    logger.info({ organizationId }, "Configuring Odoo webhooks for organization");

    const odooClientManager = getOdooClientManager();
    const client = await odooClientManager.getClient(userId, organizationId);

    // Get webhook secret from environment (shared across all organizations)
    const webhookSecret = process.env.ODOO_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("ODOO_WEBHOOK_SECRET not configured");
    }

    // Build webhook URL dynamically based on request or environment
    const baseUrl = process.env.BETTER_AUTH_URL || process.env.API_URL || "http://gateway:3000";
    const safeeApiUrl = baseUrl.replace(/\/api\/v1$/, ""); // Remove /api/v1 if present

    // Set Odoo configuration parameters
    const configParams: Record<string, string> = {
      "safee.webhooks_enabled": "True",
      "safee.webhook_url": safeeApiUrl,
      "safee.webhook_secret": webhookSecret,
      "safee.organization_id": organizationId,
    };

    for (const [key, value] of Object.entries(configParams)) {
      // Check if parameter exists
      const paramIds = await client.search("ir.config_parameter", [[["key", "=", key]]]);

      if (paramIds.length > 0) {
        // Update existing parameter
        await client.write("ir.config_parameter", paramIds, { value });
        logger.debug({ key, paramId: paramIds[0] }, "Updated Odoo config parameter");
      } else {
        // Create new parameter
        await client.create("ir.config_parameter", { key, value });
        logger.debug({ key }, "Created Odoo config parameter");
      }
    }

    logger.info({ organizationId }, "Odoo webhooks configured successfully");
  } catch (error) {
    logger.error({ error, organizationId }, "Failed to configure Odoo webhooks");
    throw error;
  }
}

/**
 * Get current webhook configuration from Odoo
 */
export async function getOdooWebhookConfig(
  logger: Logger,
  userId: string,
  organizationId: string,
): Promise<OdooWebhookConfig> {
  try {
    const odooClientManager = getOdooClientManager();
    const client = await odooClientManager.getClient(userId, organizationId);

    const getParam = async (key: string, defaultValue = ""): Promise<string> => {
      const paramIds = await client.search("ir.config_parameter", [[["key", "=", key]]]);

      if (paramIds.length === 0) {
        return defaultValue;
      }

      const params = await client.read("ir.config_parameter", paramIds, ["value"]);
      const value = params[0]?.value;
      return typeof value === "string" ? value : defaultValue;
    };

    const config: OdooWebhookConfig = {
      webhooksEnabled: (await getParam("safee.webhooks_enabled", "False")) === "True",
      webhookUrl: await getParam("safee.webhook_url"),
      webhookSecret: await getParam("safee.webhook_secret"),
      organizationId: await getParam("safee.organization_id"),
    };

    return config;
  } catch (error) {
    logger.error({ error, organizationId }, "Failed to get Odoo webhook config");
    throw error;
  }
}
