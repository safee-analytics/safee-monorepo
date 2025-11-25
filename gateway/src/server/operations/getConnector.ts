import { ConnectorManager } from "../services/connectors/connector.manager.js";
import type { ConnectorResponse } from "../dtos/connector.js";
import type { ServerContext } from "../serverContext.js";

export async function getConnector(
  ctx: ServerContext,
  connectorId: string,
  organizationId: string,
): Promise<ConnectorResponse> {
  const connectorManager = new ConnectorManager(ctx);

  const connector = await connectorManager.getConnector(connectorId, organizationId);
  const metadata = connector.getMetadata();

  return {
    id: metadata.id,
    organizationId: metadata.organizationId,
    name: metadata.name,
    description: metadata.description,
    type: metadata.type,
    isActive: metadata.isActive,
    tags: metadata.tags,
    metadata: metadata.metadata,
    createdAt: metadata.createdAt.toISOString(),
    updatedAt: metadata.updatedAt.toISOString(),
  };
}
