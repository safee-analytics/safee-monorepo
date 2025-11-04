import type { Logger } from "pino";
import {
  validateModel,
  validateFields,
  validateIds,
  validateDomain,
  validateMethod,
  validateLimit,
  validateOffset,
  validateOrder,
  sanitizeValues,
  validateExternalId,
  sanitizeError,
} from "./validation.js";

export interface OdooConnectionConfig {
  url: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface OdooAuthResult {
  uid: number;
  database: string;
  username: string;
  sessionId: string;
}

export interface OdooSearchOptions {
  limit?: number;
  offset?: number;
  order?: string;
}

export interface OdooClient {
  authenticate(): Promise<OdooAuthResult>;
  search(model: string, domain: unknown[], options?: OdooSearchOptions): Promise<number[]>;
  searchRead<T = Record<string, unknown>>(
    model: string,
    domain: unknown[],
    fields?: string[],
    options?: OdooSearchOptions,
    context?: Record<string, unknown>,
  ): Promise<T[]>;
  read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields?: string[],
    context?: Record<string, unknown>,
  ): Promise<T[]>;
  create(model: string, values: Record<string, unknown>, context?: Record<string, unknown>): Promise<number>;
  write(
    model: string,
    ids: number[],
    values: Record<string, unknown>,
    context?: Record<string, unknown>,
  ): Promise<boolean>;
  unlink(model: string, ids: number[], context?: Record<string, unknown>): Promise<boolean>;
  execute<T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>,
  ): Promise<T>;
  executeKw<T = unknown>(
    model: string,
    method: string,
    args?: unknown[],
    kwargs?: Record<string, unknown>,
  ): Promise<T>;
  action<T = unknown>(
    model: string,
    actionName: string,
    recordIds: number[],
    context?: Record<string, unknown>,
  ): Promise<T>;
  searchByExternalId(externalId: string): Promise<number | null>;
  readByExternalId<T = Record<string, unknown>>(externalId: string, fields?: string[]): Promise<T | null>;
  createWithExternalId(
    model: string,
    values: Record<string, unknown>,
    externalId: string,
    context?: Record<string, unknown>,
  ): Promise<number>;
  nameSearch(
    model: string,
    name: string,
    domain?: unknown[],
    limit?: number,
  ): Promise<Array<[number, string]>>;
  fieldsGet(model: string, fields?: string[]): Promise<Record<string, unknown>>;
}

export class OdooClientService implements OdooClient {
  private config: OdooConnectionConfig;
  private logger: Logger;
  private uid: number | null = null;
  private sessionId: string | null = null;
  private readonly timeout: number = 30000; // 30 seconds

  constructor(config: OdooConnectionConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  private get baseUrl(): string {
    return this.config.url;
  }

  async authenticate(): Promise<OdooAuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/web/session/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            db: this.config.database,
            login: this.config.username,
            password: this.config.password,
          },
          id: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Odoo authentication failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        const errorMessage =
          typeof data.error === "object"
            ? data.error.message || JSON.stringify(data.error)
            : String(data.error);
        throw new Error(`Odoo error: ${errorMessage}`);
      }

      const result = data.result as { uid: number; session_id: string };

      if (!result.uid) {
        this.logger.warn(
          { database: this.config.database, username: this.config.username },
          "Invalid credentials",
        );
        throw new Error("Invalid Odoo credentials");
      }

      this.uid = result.uid;
      this.sessionId = result.session_id;
      this.logger.info(
        { uid: result.uid, database: this.config.database, username: this.config.username },
        "Authenticated with Odoo",
      );

      return {
        uid: result.uid,
        database: this.config.database,
        username: this.config.username,
        sessionId: result.session_id,
      };
    } catch (error) {
      this.logger.error({ error, database: this.config.database }, "Odoo authentication failed");
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private async ensureAuthenticated(): Promise<number> {
    if (!this.uid) {
      await this.authenticate();
    }
    return this.uid!;
  }

  async execute<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    await this.ensureAuthenticated();

    try {
      const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${this.sessionId}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {
            model,
            method,
            args,
            kwargs,
          },
          id: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Odoo request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        const errorMessage =
          typeof data.error === "object"
            ? data.error.message || JSON.stringify(data.error)
            : String(data.error);
        throw new Error(`Odoo error: ${errorMessage}`);
      }

      return data.result as T;
    } catch (error) {
      this.logger.error({ error, model, method }, "Odoo execute_kw failed");
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  async search(model: string, domain: unknown[] = [], options: OdooSearchOptions = {}): Promise<number[]> {
    try {
      // Validate inputs
      model = validateModel(model);
      domain = validateDomain(domain);
      const limit = validateLimit(options.limit);
      const offset = validateOffset(options.offset);
      const order = validateOrder(options.order);

      const kwargs: Record<string, unknown> = {};
      if (limit) kwargs.limit = limit;
      if (offset) kwargs.offset = offset;
      if (order) kwargs.order = order;

      return await this.execute<number[]>(model, "search", [domain], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async searchRead<T = Record<string, unknown>>(
    model: string,
    domain: unknown[] = [],
    fields: string[] = [],
    options: OdooSearchOptions = {},
    context?: Record<string, unknown>,
  ): Promise<T[]> {
    try {
      model = validateModel(model);
      domain = validateDomain(domain);
      const validatedFields = fields.length > 0 ? validateFields(fields) : [];
      const limit = validateLimit(options.limit);
      const offset = validateOffset(options.offset);
      const order = validateOrder(options.order);

      const kwargs: Record<string, unknown> = {};
      if (validatedFields.length > 0) kwargs.fields = validatedFields;
      if (limit) kwargs.limit = limit;
      if (offset) kwargs.offset = offset;
      if (order) kwargs.order = order;
      if (context) kwargs.context = context;

      return await this.execute<T[]>(model, "search_read", [domain], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async read<T = Record<string, unknown>>(
    model: string,
    ids: number[],
    fields: string[] = [],
    context?: Record<string, unknown>,
  ): Promise<T[]> {
    try {
      model = validateModel(model);
      const validatedIds = validateIds(ids);
      const validatedFields = fields.length > 0 ? validateFields(fields) : [];

      const kwargs: Record<string, unknown> = {};
      if (validatedFields.length > 0) kwargs.fields = validatedFields;
      if (context) kwargs.context = context;

      return await this.execute<T[]>(model, "read", [validatedIds], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async create(
    model: string,
    values: Record<string, unknown>,
    context?: Record<string, unknown>,
  ): Promise<number> {
    try {
      model = validateModel(model);
      const sanitizedValues = sanitizeValues(values);

      const kwargs: Record<string, unknown> = {};
      if (context) kwargs.context = context;

      return await this.execute<number>(model, "create", [sanitizedValues], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async write(
    model: string,
    ids: number[],
    values: Record<string, unknown>,
    context?: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      model = validateModel(model);
      const validatedIds = validateIds(ids);
      const sanitizedValues = sanitizeValues(values);

      const kwargs: Record<string, unknown> = {};
      if (context) kwargs.context = context;

      return await this.execute<boolean>(model, "write", [validatedIds, sanitizedValues], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async unlink(model: string, ids: number[], context?: Record<string, unknown>): Promise<boolean> {
    try {
      // Validate inputs
      model = validateModel(model);
      const validatedIds = validateIds(ids);

      const kwargs: Record<string, unknown> = {};
      if (context) kwargs.context = context;

      return await this.execute<boolean>(model, "unlink", [validatedIds], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async version(): Promise<{
    server_version: string;
    server_version_info: number[];
    protocol_version: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/web/webclient/version_info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params: {},
          id: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get Odoo version: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Odoo error: ${JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Failed to get Odoo version: ${String(error)}`);
    }
  }

  async executeKw<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    return this.execute<T>(model, method, args, kwargs);
  }

  async action<T = unknown>(
    model: string,
    actionName: string,
    recordIds: number[],
    context?: Record<string, unknown>,
  ): Promise<T> {
    try {
      model = validateModel(model);
      const validatedMethod = validateMethod(actionName);
      const validatedIds = validateIds(recordIds);

      const kwargs: Record<string, unknown> = {};
      if (context) kwargs.context = context;

      return await this.execute<T>(model, validatedMethod, [validatedIds], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async searchByExternalId(externalId: string): Promise<number | null> {
    try {
      const validatedExternalId = validateExternalId(externalId);

      const result = await this.execute<number[]>(
        "ir.model.data",
        "search_read",
        [[["name", "=", validatedExternalId]]],
        { fields: ["res_id"], limit: 1 },
      );

      if (result.length > 0 && typeof result[0] === "object" && "res_id" in result[0]) {
        return (result[0] as { res_id: number }).res_id;
      }

      return null;
    } catch (error) {
      this.logger.warn({ error: sanitizeError(error), externalId }, "Failed to search by external ID");
      return null;
    }
  }

  async readByExternalId<T = Record<string, unknown>>(
    externalId: string,
    fields: string[] = [],
  ): Promise<T | null> {
    try {
      // Validate external ID and fields
      const validatedExternalId = validateExternalId(externalId);
      const validatedFields = fields.length > 0 ? validateFields(fields) : [];

      const recordId = await this.searchByExternalId(validatedExternalId);
      if (!recordId) {
        return null;
      }

      const records = await this.read<T>("ir.model.data", [recordId], validatedFields);
      return records.length > 0 ? records[0] : null;
    } catch (error) {
      this.logger.warn({ error: sanitizeError(error), externalId }, "Failed to read by external ID");
      return null;
    }
  }

  async createWithExternalId(
    model: string,
    values: Record<string, unknown>,
    externalId: string,
    context?: Record<string, unknown>,
  ): Promise<number> {
    try {
      model = validateModel(model);
      const validatedExternalId = validateExternalId(externalId);
      const sanitizedValues = sanitizeValues(values);

      const recordId = await this.create(model, sanitizedValues, context);

      await this.create("ir.model.data", {
        name: validatedExternalId,
        model: model,
        res_id: recordId,
        module: "__export__",
      });

      return recordId;
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async nameSearch(
    model: string,
    name: string,
    domain: unknown[] = [],
    limit: number = 100,
  ): Promise<Array<[number, string]>> {
    try {
      model = validateModel(model);
      const validatedDomain = validateDomain(domain);
      const validatedLimit = validateLimit(limit) || 100;

      return await this.execute<Array<[number, string]>>(model, "name_search", [name], {
        args: validatedDomain,
        limit: validatedLimit,
      });
    } catch (error) {
      throw sanitizeError(error);
    }
  }

  async fieldsGet(model: string, fields: string[] = []): Promise<Record<string, unknown>> {
    try {
      model = validateModel(model);
      const validatedFields = fields.length > 0 ? validateFields(fields) : [];

      const kwargs: Record<string, unknown> = {};
      if (validatedFields.length > 0) kwargs.allfields = validatedFields;

      return await this.execute<Record<string, unknown>>(model, "fields_get", [], kwargs);
    } catch (error) {
      throw sanitizeError(error);
    }
  }
}

export function createOdooClient(config: OdooConnectionConfig, logger: Logger): OdooClient {
  return new OdooClientService(config, logger);
}
