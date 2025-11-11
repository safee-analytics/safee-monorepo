import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import type { UpdateConnectorRequest } from "../dtos/connector.js";

export async function updateConnector(
  drizzle: DrizzleClient,
  connectorId: string,
  organizationId: string,
  userId: string,
  request: UpdateConnectorRequest,
): Promise<{ success: boolean }> {
  const connectorManager = new ConnectorManager(drizzle);

  return await connectorManager.updateConnector(connectorId, organizationId, {
    ...request,
    updatedBy: userId,
  });
}
