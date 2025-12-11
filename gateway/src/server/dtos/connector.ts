import type { ConnectorType, ConnectorConfig } from "../services/connectors/base.connector.js";

export interface CreateConnectorRequest {
  name: string;
  description?: string;
  type: ConnectorType;
  config: ConnectorConfig;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateConnectorRequest {
  name?: string;
  description?: string;
  config?: ConnectorConfig;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export interface ConnectorResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ConnectorType;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  lastConnectionTest?: string;
  lastConnectionStatus?: string;
  lastConnectionError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueryRequest {
  sql: string;
  params?: unknown[];
}

export interface QueryResponse<T = unknown> {
  rows: T[];
  rowCount: number;
  executionTime: number;
}

export interface SchemaResponse {
  tables: {
    schema: string;
    name: string;
    type: "table" | "view";
  }[];
}

export interface TablePreviewResponse {
  schema: string;
  table: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
  }[];
  sampleData: unknown[];
  totalRows: number;
}

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: "lowercase" | "uppercase" | "trim" | "date" | "number" | "boolean";
  defaultValue?: unknown;
}

export interface SuggestMappingsRequest {
  sourceColumns: string[];
  targetEntity: "contact" | "deal" | "company" | "invoice" | "employee" | "custom";
}
