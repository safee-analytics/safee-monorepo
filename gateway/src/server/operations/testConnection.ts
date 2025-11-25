import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function testConnection(
  ctx: ServerContext,
  connectorId: string,
  organizationId: string,
): Promise<{
  status: string;
  message: string;
  latency?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}> {
  const connectorManager = new ConnectorManager(ctx);

  return await connectorManager.testConnection(connectorId, organizationId);
}
