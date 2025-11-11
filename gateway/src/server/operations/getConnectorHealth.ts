import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function getConnectorHealth(
  drizzle: DrizzleClient,
  connectorId: string,
  organizationId: string,
): Promise<{
  healthy: boolean;
  message?: string;
  details?: Record<string, unknown>;
}> {
  const connectorManager = new ConnectorManager(drizzle);

  return await connectorManager.getConnectorHealth(connectorId, organizationId);
}
