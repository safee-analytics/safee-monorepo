import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import type { CreateConnectorRequest, ConnectorResponse } from "../dtos/connector.js";

export async function createConnector(
  ctx: ServerContext,
  organizationId: string,
  userId: string,
  request: CreateConnectorRequest,
): Promise<ConnectorResponse> {
  const connectorManager = new ConnectorManager(ctx);

  const { connector } = await connectorManager.createConnector({
    organizationId,
    name: request.name,
    description: request.description,
    type: request.type,
    config: request.config,
    tags: request.tags,
    metadata: request.metadata,
    createdBy: userId,
  });

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
