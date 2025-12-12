import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import type { ConnectorType } from "../services/connectors/base.connector.js";
import type { ConnectorResponse } from "../dtos/connector.js";

export async function listConnectors(
  ctx: ServerContext,
  organizationId: string,
  filters: { type?: ConnectorType; isActive?: boolean; tags?: string[] },
): Promise<ConnectorResponse[]> {
  const connectorManager = new ConnectorManager(ctx);

  const connectors = await connectorManager.listConnectors(organizationId, filters);

  return connectors.map((c) => ({
    id: c.id,
    organizationId: c.organizationId,
    name: c.name,
    description: c.description,
    type: c.type as ConnectorType,
    isActive: c.isActive,
    tags: c.tags ?? [],
    metadata: c.metadata ?? {},
    lastConnectionTest: c.lastConnectionTest?.toISOString(),
    lastConnectionStatus: c.lastConnectionStatus,
    lastConnectionError: c.lastConnectionError,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}
