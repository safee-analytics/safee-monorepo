import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";

export async function searchTable(
  ctx: ServerContext,
  organizationId: string,
  connectorId: string,
  schemaName: string,
  tableName: string,
  searchTerm: string,
  searchColumns: string[],
  limit: number,
): Promise<unknown[]> {
  const connectorManager = new ConnectorManager(ctx);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.searchTable(organizationId, connectorId, {
    schema: schemaName,
    table: tableName,
    searchColumns,
    searchTerm,
    limit,
  });
}
