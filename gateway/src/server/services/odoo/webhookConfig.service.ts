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
    const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.API_URL ?? "http://gateway:3000";
    const safeeApiUrl = baseUrl.replace(/\/api\/v1$/, ""); // Remove /api/v1 if present

    // Set Odoo configuration parameters
    const configParams: Record<string, string> = {
      "safee.webhooks_enabled": "True",
      "safee.webhook_url": safeeApiUrl,
      "safee.webhook_secret": webhookSecret,
      "safee.organization_id": organizationId,
    };

    // Track changes for rollback
    const appliedChanges: Array<{ key: string; paramId?: number; oldValue?: string; isNew: boolean }> = [];

    try {
      for (const [key, value] of Object.entries(configParams)) {
        // Check if parameter exists
        const paramIds = await client.search("ir.config_parameter", [[["key", "=", key]]]);

        if (paramIds.length > 0) {
          // Get old value for rollback
          const oldParams = await client.read("ir.config_parameter", paramIds, ["value"]);
          const oldValue = oldParams[0]?.value;

          // Update existing parameter
          await client.write("ir.config_parameter", paramIds, { value });
          logger.debug({ key, paramId: paramIds[0] }, "Updated Odoo config parameter");

          appliedChanges.push({
            key,
            paramId: paramIds[0],
            oldValue: typeof oldValue === "string" ? oldValue : undefined,
            isNew: false,
          });
        } else {
          // Create new parameter
          const newParamId = await client.create("ir.config_parameter", { key, value });
          logger.debug({ key, paramId: newParamId }, "Created Odoo config parameter");

          appliedChanges.push({ key, paramId: newParamId, isNew: true });
        }
      }

      logger.info({ organizationId }, "✅ Odoo webhooks configured successfully");
    } catch (err) {
      logger.error(
        { error: err, organizationId, changesApplied: appliedChanges.length },
        "❌ Failed to configure Odoo webhooks, rolling back",
      );

      // Rollback: Revert all applied changes
      for (const change of appliedChanges.reverse()) {
        try {
          if (change.isNew && change.paramId) {
            // Delete newly created parameter
            await client.unlink("ir.config_parameter", [change.paramId]);
            logger.debug({ key: change.key, paramId: change.paramId }, "Rollback: Deleted config parameter");
          } else if (change.oldValue !== undefined && change.paramId) {
            // Restore old value
            await client.write("ir.config_parameter", [change.paramId], { value: change.oldValue });
            logger.debug({ key: change.key, paramId: change.paramId }, "Rollback: Restored old config value");
          }
        } catch (rollbackErr) {
          logger.error(
            { key: change.key, paramId: change.paramId, error: rollbackErr },
            "❌ Rollback failed for config parameter",
          );
        }
      }

      throw err;
    }
  } catch (err) {
    logger.error({ error: err, organizationId }, "Failed to configure Odoo webhooks");
    throw err;
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

    async function getParam(key: string, defaultValue = ""): Promise<string> {
      const paramIds = await client.search("ir.config_parameter", [[["key", "=", key]]]);

      if (paramIds.length === 0) {
        return defaultValue;
      }

      const params = await client.read("ir.config_parameter", paramIds, ["value"]);
      const value = params[0]?.value;
      return typeof value === "string" ? value : defaultValue;
    }

    const config: OdooWebhookConfig = {
      webhooksEnabled: (await getParam("safee.webhooks_enabled", "False")) === "True",
      webhookUrl: await getParam("safee.webhook_url"),
      webhookSecret: await getParam("safee.webhook_secret"),
      organizationId: await getParam("safee.organization_id"),
    };

    return config;
  } catch (err) {
    logger.error({ error: err, organizationId }, "Failed to get Odoo webhook config");
    throw err;
  }
}
