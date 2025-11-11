import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import type { QueryRequest, QueryResponse } from "../dtos/connector.js";

export async function executeQuery(
  drizzle: DrizzleClient,
  organizationId: string,
  connectorId: string,
  request: QueryRequest,
): Promise<QueryResponse> {
  const connectorManager = new ConnectorManager(drizzle);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.executeQuery(organizationId, {
    connectorId,
    sql: request.sql,
    params: request.params,
  });
}
