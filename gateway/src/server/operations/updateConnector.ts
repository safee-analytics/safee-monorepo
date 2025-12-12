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
    name: request.name ?? undefined,
    description: request.description ?? undefined,
    config: request.config ?? undefined,
    tags: request.tags ?? undefined,
    metadata: request.metadata ?? undefined,
    isActive: request.isActive ?? undefined,
    updatedBy: userId,
  });
}
