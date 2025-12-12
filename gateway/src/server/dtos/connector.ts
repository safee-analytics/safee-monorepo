import type { ConnectorType, ConnectorConfig } from "../services/connectors/base.connector.js";

export interface CreateConnectorRequest {
  name: string;
  description?: string | null;
  type: ConnectorType;
  config: ConnectorConfig;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateConnectorRequest {
  name?: string | null;
  description?: string | null;
  config?: ConnectorConfig | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  isActive?: boolean | null;
}

export interface ConnectorResponse {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  type: ConnectorType;
  isActive: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  lastConnectionTest?: string | null;
  lastConnectionStatus?: string | null;
  lastConnectionError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QueryRequest {
  sql: string;
  params?: unknown[] | null;
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
  transform?: "lowercase" | "uppercase" | "trim" | "date" | "number" | "boolean" | null;
  defaultValue?: unknown | null;
}

export interface SuggestMappingsRequest {
  sourceColumns: string[];
  targetEntity: "contact" | "deal" | "company" | "invoice" | "employee" | "custom";
}
