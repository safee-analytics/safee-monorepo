import type { ServerContext } from "../serverContext.js";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import { DataMapperService } from "../services/connectors/data-mapper.service.js";
import type { SuggestMappingsRequest, FieldMapping } from "../dtos/connector.js";

export async function suggestMappings(
  ctx: ServerContext,
  request: SuggestMappingsRequest,
): Promise<FieldMapping[]> {
  const connectorManager = new ConnectorManager(ctx);
  const dataProxyService = new DataProxyService(connectorManager);
  const dataMapperService = new DataMapperService(dataProxyService);

  return dataMapperService.suggestMappings(request.sourceColumns, request.targetEntity);
}
