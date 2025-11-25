import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function getConnectorHealth(
  ctx: ServerContext,
  connectorId: string,
  organizationId: string,
): Promise<{
  healthy: boolean;
  message?: string;
  details?: Record<string, unknown>;
}> {
  const connectorManager = new ConnectorManager(ctx);

  return await connectorManager.getConnectorHealth(connectorId, organizationId);
}
