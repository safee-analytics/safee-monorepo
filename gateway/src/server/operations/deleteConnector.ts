import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";

export async function deleteConnector(
  ctx: ServerContext,
  connectorId: string,
  organizationId: string,
): Promise<{ success: boolean }> {
  const connectorManager = new ConnectorManager(ctx);

  return await connectorManager.deleteConnector(connectorId, organizationId);
}
