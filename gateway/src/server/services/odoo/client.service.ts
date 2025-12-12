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
import { odooApiResponseSchema } from "./schemas.js";

export interface OdooConnectionConfig {
  url: string;
  port: number;
  database: string;
  username: string;
  password: string; // Can be either a password or an API key (API keys are preferred)
}

export interface OdooAuthResult {
  uid: number;
  database: string;
  username: string;
  sessionId: string | null;
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
  nameSearch(model: string, name: string, domain?: unknown[], limit?: number): Promise<[number, string][]>;
  fieldsGet(model: string, fields?: string[]): Promise<Record<string, unknown>>;
}

export class OdooClientService implements OdooClient {
  private config: OdooConnectionConfig;
  private logger: Logger;
  private uid: number | null = null;
  private sessionId: string | null = null;
  private cookies: string[] = []; // Store all cookies from authentication
  private useXmlRpc = false; // Track if we're using XML-RPC (API keys)
  private readonly timeout: number = 30000; // 30 seconds

  constructor(config: OdooConnectionConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  private get baseUrl(): string {
    return this.config.url;
  }

  /**
   * Authenticate with Odoo
   * Supports both password and API key authentication
   * In Odoo 17+, API keys work through the same web session endpoint as passwords
   */
  async authenticate(): Promise<OdooAuthResult> {
    try {
      // Detect if this is an API key (contains underscore and is ~29 chars)
      const isApiKey = this.config.password.includes("_") && this.config.password.length >= 25;

      // Use web session authenticate for both password and API key authentication
      // In Odoo 17+, API keys work as passwords in the web session endpoint
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

      const rawData: unknown = await response.json();
      const parseResult = odooApiResponseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new Error(`Invalid Odoo response: ${parseResult.error.message}`);
      }

      const data = parseResult.data;

      if (data.error) {
        // Log full error details for debugging
        this.logger.error(
          {
            database: this.config.database,
            username: this.config.username,
            errorData: data.error,
          },
          "Odoo authentication error details",
        );

        const errorMessage =
          typeof data.error === "object" && "message" in data.error
            ? String(data.error.message)
            : JSON.stringify(data.error);
        throw new Error(`Odoo authentication error: ${errorMessage}`);
      }

      const result = data.result as { uid: number; session_id: string };

      if (!result.uid) {
        this.logger.warn(
          { database: this.config.database, username: this.config.username },
          "Invalid credentials",
        );
        throw new Error("Invalid Odoo credentials");
      }

      // Capture all cookies from the authentication response
      const setCookieHeaders = response.headers.getSetCookie();
      if (setCookieHeaders.length > 0) {
        this.cookies = setCookieHeaders.map((cookie) => cookie.split(";")[0]);
        this.logger.info(
          {
            cookieCount: this.cookies.length,
            cookies: this.cookies,
            sessionId: result.session_id,
          },
          "Captured cookies from Odoo authentication",
        );
      } else {
        this.logger.warn(
          { sessionId: result.session_id },
          "No Set-Cookie headers received from Odoo authentication - will use session_id only",
        );
      }

      this.uid = result.uid;
      this.sessionId = result.session_id;
      this.useXmlRpc = isApiKey; // Track if using API key for future requests

      this.logger.info(
        {
          uid: result.uid,
          database: this.config.database,
          username: this.config.username,
          sessionIdFromResult: result.session_id,
          sessionIdStored: this.sessionId,
          sessionIdType: typeof result.session_id,
          authMethod: isApiKey ? "API key" : "password",
        },
        `Authenticated with Odoo via ${isApiKey ? "API key" : "password"}`,
      );

      return {
        uid: result.uid,
        database: this.config.database,
        username: this.config.username,
        sessionId: result.session_id,
      };
    } catch (err) {
      this.logger.error({ error: err, database: this.config.database }, "Odoo authentication failed");
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  private async ensureAuthenticated(): Promise<number> {
    if (!this.uid) {
      await this.authenticate();
    }
    return this.uid!;
  }

  private isSessionExpiredError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const errorStr = error.message.toLowerCase();

    // Check for various session expiry indicators
    return (
      errorStr.includes("session expired") ||
      errorStr.includes("sessionexpiredexception") ||
      errorStr.includes("session_expired") ||
      errorStr.includes('"code":100') || // Odoo error code for session expiry
      errorStr.includes("odoo session expired")
    );
  }

  /**
   * Execute method using JSON-RPC (for API key authentication)
   */
  private async executeJsonRpc<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
  ): Promise<T> {
    this.logger.info({ model, method, useJsonRpc: true }, "Executing Odoo JSON-RPC call with API key");

    const response = await fetch(`${this.baseUrl}/jsonrpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.config.database,
            this.uid,
            this.config.password, // API key
            model,
            method,
            args,
            kwargs,
          ],
        },
        id: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`JSON-RPC request failed: ${response.status}`);
    }

    const rawData: unknown = await response.json();
    const parseResult = odooApiResponseSchema.safeParse(rawData);

    if (!parseResult.success) {
      throw new Error(`Invalid Odoo response: ${parseResult.error.message}`);
    }

    const data = parseResult.data;

    if (data.error) {
      const errorMessage =
        typeof data.error === "object" && "message" in data.error
          ? String(data.error.message)
          : JSON.stringify(data.error);
      throw new Error(`Odoo JSON-RPC error: ${errorMessage}`);
    }

    return data.result as T;
  }

  /**
   * Serialize JavaScript values to XML-RPC format
   */
  private serializeToXml(value: unknown): string {
    if (value === null || value === undefined) {
      return "<value><boolean>0</boolean></value>";
    }
    if (typeof value === "boolean") {
      return `<value><boolean>${value ? "1" : "0"}</boolean></value>`;
    }
    if (typeof value === "number") {
      return Number.isInteger(value)
        ? `<value><int>${value}</int></value>`
        : `<value><double>${value}</double></value>`;
    }
    if (typeof value === "string") {
      return `<value><string>${this.escapeXml(value)}</string></value>`;
    }
    if (Array.isArray(value)) {
      const items = value.map((item) => this.serializeToXml(item)).join("");
      return `<array><data>${items}</data></array>`;
    }
    if (typeof value === "object") {
      const members = Object.entries(value as Record<string, unknown>)
        .map(
          ([key, val]) => `<member><name>${this.escapeXml(key)}</name>${this.serializeToXml(val)}</member>`,
        )
        .join("");
      return `<struct>${members}</struct>`;
    }
    return "<value><string></string></value>";
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Parse XML-RPC response
   */
  private parseXmlRpcResponse(xml: string): unknown {
    // Check for fault
    if (xml.includes("<fault>")) {
      const errorMatch = /<string>(.*?)<\/string>/.exec(xml);
      throw new Error(`XML-RPC error: ${errorMatch ? errorMatch[1] : "Unknown error"}`);
    }

    // Extract the methodResponse > params > param > value content
    const valueMatch =
      /<methodResponse>\s*<params>\s*<param>\s*<value>([\s\S]*?)<\/value>\s*<\/param>\s*<\/params>\s*<\/methodResponse>/.exec(
        xml,
      );

    if (!valueMatch) {
      this.logger.warn({ xmlSnippet: xml.substring(0, 500) }, "Could not find value in XML-RPC response");
      return [];
    }

    const valueXml = valueMatch[1];
    return this.parseXmlValue(valueXml);
  }

  /**
   * Parse an XML-RPC value element
   */
  private parseXmlValue(xml: string): unknown {
    xml = xml.trim();

    // Parse integer
    const intMatch = /^<int>(\d+)<\/int>$/.exec(xml);
    if (intMatch) {
      return parseInt(intMatch[1]);
    }

    // Parse boolean
    const boolMatch = /^<boolean>([01])<\/boolean>$/.exec(xml);
    if (boolMatch) {
      return boolMatch[1] === "1";
    }

    // Parse double
    const doubleMatch = /^<double>([-+]?[0-9]*\.?[0-9]+)<\/double>$/.exec(xml);
    if (doubleMatch) {
      return parseFloat(doubleMatch[1]);
    }

    // Parse string
    const stringMatch = /^<string>([\s\S]*?)<\/string>$/.exec(xml);
    if (stringMatch) {
      return this.unescapeXml(stringMatch[1]);
    }

    // Parse array
    const arrayMatch = /^<array>\s*<data>([\s\S]*?)<\/data>\s*<\/array>$/.exec(xml);
    if (arrayMatch) {
      return this.parseXmlArray(arrayMatch[1]);
    }

    // Parse struct
    const structMatch = /^<struct>([\s\S]*?)<\/struct>$/.exec(xml);
    if (structMatch) {
      return this.parseXmlStruct(structMatch[1]);
    }

    // Empty value defaults to empty string
    if (xml === "") {
      return "";
    }

    this.logger.warn({ xmlSnippet: xml.substring(0, 200) }, "Could not parse XML value");
    return null;
  }

  /**
   * Parse an XML-RPC array
   */
  private parseXmlArray(dataXml: string): unknown[] {
    const result: unknown[] = [];

    // Match all <value>...</value> elements
    const valueRegex = /<value>([\s\S]*?)<\/value>/g;
    let match;

    while ((match = valueRegex.exec(dataXml)) !== null) {
      result.push(this.parseXmlValue(match[1]));
    }

    return result;
  }

  /**
   * Parse an XML-RPC struct (object)
   */
  private parseXmlStruct(structXml: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Match all <member>...</member> elements
    const memberRegex = /<member>\s*<name>([\s\S]*?)<\/name>\s*<value>([\s\S]*?)<\/value>\s*<\/member>/g;
    let match;

    while ((match = memberRegex.exec(structXml)) !== null) {
      const name = this.unescapeXml(match[1]);
      const value = this.parseXmlValue(match[2]);
      result[name] = value;
    }

    return result;
  }

  /**
   * Unescape XML entities
   */
  private unescapeXml(str: string): string {
    return str
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&");
  }

  async execute<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {},
    retryCount = 0,
  ): Promise<T> {
    await this.ensureAuthenticated();

    try {
      // In Odoo 17+, both password and API key authentication use web session endpoints
      // Build cookie header from all stored cookies
      const cookieHeader = this.cookies.length > 0 ? this.cookies.join("; ") : `session_id=${this.sessionId}`;

      this.logger.info(
        {
          model,
          method,
          url: `${this.baseUrl}/web/dataset/call_kw`,
          hasCookies: this.cookies.length > 0,
          cookieCount: this.cookies.length,
          hasSessionId: !!this.sessionId,
          authMethod: this.useXmlRpc ? "API key" : "password",
        },
        "Executing Odoo RPC call",
      );

      const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
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
        // Try to get response body for more details
        let errorBody;
        try {
          errorBody = await response.text();
        } catch (err) {
          errorBody = `Could not read error body: ${err instanceof Error ? err.message : String(err)}`;
        }

        this.logger.error(
          {
            model,
            method,
            status: response.status,
            statusText: response.statusText,
            url: `${this.baseUrl}/web/dataset/call_kw`,
            cookieCount: this.cookies.length,
            responseBody: errorBody,
          },
          "Odoo RPC request failed with non-OK status",
        );
        throw new Error(`Odoo request failed: ${response.status} ${response.statusText}`);
      }

      const rawData: unknown = await response.json();
      const parseResult = odooApiResponseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new Error(`Invalid Odoo response: ${parseResult.error.message}`);
      }

      const data = parseResult.data;

      if (data.error) {
        this.logger.error(
          {
            model,
            method,
            errorData: data.error,
          },
          "Odoo RPC returned error in response",
        );

        const errorMessage =
          typeof data.error === "object" && "message" in data.error
            ? String(data.error.message)
            : JSON.stringify(data.error);
        throw new Error(`Odoo error: ${errorMessage}`);
      }

      return data.result as T;
    } catch (err) {
      // Check if session expired and retry once
      if (this.isSessionExpiredError(err) && retryCount === 0) {
        this.logger.info(
          { model, method, retryCount },
          "Odoo session expired, re-authenticating and retrying",
        );

        // Clear session and re-authenticate
        this.uid = null;
        this.sessionId = null;
        this.cookies = [];
        await this.authenticate();

        // Retry the request once
        return this.execute<T>(model, method, args, kwargs, retryCount + 1);
      }

      this.logger.error({ error: err, model, method, retryCount }, "Odoo execute_kw failed");
      throw err instanceof Error ? err : new Error(String(err));
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      throw sanitizeError(err);
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

      const rawData: unknown = await response.json();
      const parseResult = odooApiResponseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new Error(`Invalid Odoo response: ${parseResult.error.message}`);
      }

      const data = parseResult.data;

      if (data.error) {
        throw new Error(`Odoo error: ${JSON.stringify(data.error)}`);
      }

      return data.result as {
        server_version: string;
        server_version_info: number[];
        protocol_version: number;
      };
    } catch (err) {
      throw err instanceof Error ? err : new Error(`Failed to get Odoo version: ${String(err)}`);
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
    } catch (err) {
      throw sanitizeError(err);
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
    } catch (err) {
      this.logger.warn({ error: sanitizeError(err), externalId }, "Failed to search by external ID");
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
    } catch (err) {
      this.logger.warn({ error: sanitizeError(err), externalId }, "Failed to read by external ID");
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
        model,
        res_id: recordId,
        module: "__export__",
      });

      return recordId;
    } catch (err) {
      throw sanitizeError(err);
    }
  }

  async nameSearch(
    model: string,
    name: string,
    domain: unknown[] = [],
    limit = 100,
  ): Promise<[number, string][]> {
    try {
      model = validateModel(model);
      const validatedDomain = validateDomain(domain);
      const validatedLimit = validateLimit(limit) ?? 100;

      return await this.execute<[number, string][]>(model, "name_search", [name], {
        args: validatedDomain,
        limit: validatedLimit,
      });
    } catch (err) {
      throw sanitizeError(err);
    }
  }

  async fieldsGet(model: string, fields: string[] = []): Promise<Record<string, unknown>> {
    try {
      model = validateModel(model);
      const validatedFields = fields.length > 0 ? validateFields(fields) : [];

      const kwargs: Record<string, unknown> = {};
      if (validatedFields.length > 0) kwargs.allfields = validatedFields;

      return await this.execute<Record<string, unknown>>(model, "fields_get", [], kwargs);
    } catch (err) {
      throw sanitizeError(err);
    }
  }
}

export function createOdooClient(config: OdooConnectionConfig, logger: Logger): OdooClient {
  return new OdooClientService(config, logger);
}
