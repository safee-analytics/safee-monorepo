import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import type { QueryRequest, QueryResponse } from "../dtos/connector.js";

export async function executeQuery(
  ctx: ServerContext,
  organizationId: string,
  connectorId: string,
  request: QueryRequest,
): Promise<QueryResponse> {
  const connectorManager = new ConnectorManager(ctx);
  const dataProxyService = new DataProxyService(connectorManager);

  return await dataProxyService.executeQuery(organizationId, {
    connectorId,
    sql: request.sql,
    params: request.params ?? undefined,
  });
}
