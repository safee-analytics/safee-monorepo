import type { DrizzleClient } from "@safee/database";
import { ConnectorManager } from "../services/connectors/connector.manager.js";
import { DataProxyService } from "../services/connectors/data-proxy.service.js";
import { DataMapperService } from "../services/connectors/data-mapper.service.js";
import type { SuggestMappingsRequest, FieldMapping } from "../dtos/connector.js";

export async function suggestMappings(
  drizzle: DrizzleClient,
  request: SuggestMappingsRequest,
): Promise<FieldMapping[]> {
  const connectorManager = new ConnectorManager(drizzle);
  const dataProxyService = new DataProxyService(connectorManager);
  const dataMapperService = new DataMapperService(dataProxyService);

  return dataMapperService.suggestMappings(request.sourceColumns, request.targetEntity);
}
