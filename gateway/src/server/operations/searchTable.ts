import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";

export async function searchTable(
  drizzle: DrizzleClient,
  organizationId: string,
  connectorId: string,
  schemaName: string,
  tableName: string,
  searchTerm: string,
  searchColumns: string[],
  limit: number,
): Promise<unknown[]> {
  const connectorManager = new ConnectorManager(drizzle);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.searchTable(organizationId, connectorId, {
    schema: schemaName,
    table: tableName,
    searchColumns,
    searchTerm,
    limit,
  });
}
