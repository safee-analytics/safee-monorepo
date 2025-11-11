import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import type { TablePreviewResponse } from "../dtos/connector.js";

export async function getTablePreview(
  drizzle: DrizzleClient,
  organizationId: string,
  connectorId: string,
  schemaName: string,
  tableName: string,
  limit: number,
): Promise<TablePreviewResponse> {
  const connectorManager = new ConnectorManager(drizzle);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.getTablePreview(organizationId, connectorId, schemaName, tableName, limit);
}
