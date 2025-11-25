import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import type { UpdateConnectorRequest } from "../dtos/connector.js";

export async function updateConnector(
  ctx: ServerContext,
  connectorId: string,
  organizationId: string,
  userId: string,
  request: UpdateConnectorRequest,
): Promise<{ success: boolean }> {
  const connectorManager = new ConnectorManager(ctx);

  return await connectorManager.updateConnector(connectorId, organizationId, {
    ...request,
    updatedBy: userId,
  });
}
