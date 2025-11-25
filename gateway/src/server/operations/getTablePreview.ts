import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import type { TablePreviewResponse } from "../dtos/connector.js";

export async function getTablePreview(
  ctx: ServerContext,
  organizationId: string,
  connectorId: string,
  schemaName: string,
  tableName: string,
  limit: number,
): Promise<TablePreviewResponse> {
  const connectorManager = new ConnectorManager(ctx);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.getTablePreview(organizationId, connectorId, schemaName, tableName, limit);
}
