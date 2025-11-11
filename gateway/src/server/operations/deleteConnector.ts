import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function deleteConnector(
  drizzle: DrizzleClient,
  connectorId: string,
  organizationId: string,
): Promise<{ success: boolean }> {
  const connectorManager = new ConnectorManager(drizzle);

  return await connectorManager.deleteConnector(connectorId, organizationId);
}
