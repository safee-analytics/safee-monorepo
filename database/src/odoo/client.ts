import { odooApiResponseSchema } from "./schemas.js";

class BadGateway extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadGateway";
  }
}

export interface OdooAuthResponse {
  uid: number;
  session_id: string;
  user_context?: {
    lang: string;
    tz: string;
    uid: number;
  };
}

export interface OdooModelCallParams {
  model: string;
  method: string;
  args: unknown[];
  kwargs?: Record<string, unknown>;
}

export interface OdooDatabase {
  name: string;
  created: boolean;
}

export interface CreateDatabaseParams {
  masterPassword: string;
  name: string;
  adminLogin: string;
  adminPassword: string;
  lang?: string;
  countryCode?: string;
  phone?: string;
}

export interface BackupDatabaseParams {
  masterPassword: string;
  name: string;
  format?: "zip" | "dump";
}

export class OdooClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.ODOO_URL ?? "http://localhost:8069") {
    this.baseUrl = baseUrl;
  }

  private async callJsonRpc<T = unknown>(
    endpoint: string,
    params: Record<string, unknown> = {},
    headers: Record<string, string> = {},
  ): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 seconds timeout

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "call",
          params,
          id: null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new BadGateway(`Odoo request failed: ${response.status} ${response.statusText}`);
      }

      const rawData: unknown = await response.json();
      const parseResult = odooApiResponseSchema.safeParse(rawData);

      if (!parseResult.success) {
        throw new BadGateway(`Invalid Odoo response: ${parseResult.error.message}`);
      }

      const data = parseResult.data;

      if (data.error) {
        const errorMessage =
          typeof data.error === "object" && "message" in data.error
            ? String(data.error.message)
            : JSON.stringify(data.error);
        throw new BadGateway(`Odoo error: ${errorMessage}`);
      }

      return data.result as T;
    } catch (err) {
      if (err instanceof BadGateway) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadGateway(`Odoo request error: ${errorMessage}`);
    }
  }

  private async callFormUrlEncoded(endpoint: string, params: Record<string, string>): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 30000); // 30 seconds timeout
      const formData = new URLSearchParams(params);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new BadGateway(`Odoo request failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      if (err instanceof BadGateway) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadGateway(`Odoo request error: ${errorMessage}`);
    }
  }

  async createDatabase(params: CreateDatabaseParams): Promise<OdooDatabase> {
    await this.callFormUrlEncoded("/web/database/create", {
      master_pwd: params.masterPassword,
      name: params.name,
      demo: "false",
      lang: params.lang ?? "en_US",
      password: params.adminPassword,
      login: params.adminLogin,
      country_code: params.countryCode ?? "SA",
      phone: params.phone ?? "",
    });

    return {
      name: params.name,
      created: true,
    };
  }

  async listDatabases(): Promise<string[]> {
    const result = await this.callJsonRpc("/web/database/list", {});
    return result as string[];
  }

  async databaseExists(name: string): Promise<boolean> {
    const databases = await this.listDatabases();
    return databases.includes(name);
  }

  async dropDatabase(masterPassword: string, name: string): Promise<void> {
    await this.callFormUrlEncoded("/web/database/drop", {
      master_pwd: masterPassword,
      name,
    });
  }

  async duplicateDatabase(
    masterPassword: string,
    originalName: string,
    newName: string,
    neutralize = false,
  ): Promise<void> {
    await this.callFormUrlEncoded("/web/database/duplicate", {
      master_pwd: masterPassword,
      name: originalName,
      new_name: newName,
      neutralize_database: neutralize.toString(),
    });
  }

  async changeAdminPassword(masterPassword: string, newPassword: string): Promise<void> {
    await this.callFormUrlEncoded("/web/database/change_password", {
      master_pwd: masterPassword,
      master_pwd_new: newPassword,
    });
  }

  async backupDatabase(params: BackupDatabaseParams): Promise<Buffer> {
    try {
      const formData = new URLSearchParams({
        master_pwd: params.masterPassword,
        name: params.name,
        backup_format: params.format ?? "zip",
      });

      const response = await fetch(`${this.baseUrl}/web/database/backup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new BadGateway(`Odoo backup failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (err instanceof BadGateway) {
        throw err;
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      throw new BadGateway(`Odoo backup error: ${errorMessage}`);
    }
  }

  /**
   * Authenticate with Odoo and get a session
   */
  async authenticate(database: string, login: string, password: string): Promise<OdooAuthResponse> {
    const result = await this.callJsonRpc("/web/session/authenticate", {
      db: database,
      login,
      password,
    });

    return result as OdooAuthResponse;
  }

  /**
   * Call a method on an Odoo model (requires authentication)
   * @param sessionId - Session ID from authenticate()
   * @param params - Model call parameters
   *
   * @example
   * // Search for users
   * await callModel(sessionId, {
   *   model: 'res.users',
   *   method: 'search_read',
   *   args: [[]],
   *   kwargs: { fields: ['name', 'email'], limit: 10 }
   * });
   *
   * @example
   * // Create a partner
   * await callModel(sessionId, {
   *   model: 'res.partner',
   *   method: 'create',
   *   args: [{ name: 'John Doe', email: 'john@example.com' }],
   * });
   */
  async callModel(sessionId: string, params: OdooModelCallParams): Promise<unknown> {
    const result = await this.callJsonRpc(
      "/web/dataset/call_kw",
      {
        model: params.model,
        method: params.method,
        args: params.args,
        kwargs: params.kwargs ?? {},
      },
      {
        Cookie: `session_id=${sessionId}`,
      },
    );

    return result;
  }

  /**
   * Search and read records from an Odoo model
   */
  async searchRead(
    sessionId: string,
    model: string,
    domain: unknown[] = [],
    fields: string[] = [],
    limit?: number,
    offset?: number,
  ): Promise<unknown[]> {
    const result = await this.callModel(sessionId, {
      model,
      method: "search_read",
      args: [domain],
      kwargs: {
        fields,
        ...(limit && { limit }),
        ...(offset && { offset }),
      },
    });

    return result as unknown[];
  }

  /**
   * Create a record in an Odoo model
   */
  async create(sessionId: string, model: string, values: Record<string, unknown>): Promise<number> {
    const result = await this.callModel(sessionId, {
      model,
      method: "create",
      args: [values],
    });

    return result as number;
  }

  /**
   * Update records in an Odoo model
   */
  async write(
    sessionId: string,
    model: string,
    ids: number[],
    values: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.callModel(sessionId, {
      model,
      method: "write",
      args: [ids, values],
    });

    return result as boolean;
  }

  /**
   * Update records using external API with execute_kw (for database provisioning)
   */
  async writeExternal(
    database: string,
    uid: number,
    password: string,
    model: string,
    ids: number[],
    values: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.callJsonRpc("/jsonrpc", {
      service: "object",
      method: "execute_kw",
      args: [database, uid, password, model, "write", [ids, values]],
    });
    return result as boolean;
  }

  /**
   * Delete records from an Odoo model
   */
  async unlink(sessionId: string, model: string, ids: number[]): Promise<boolean> {
    const result = await this.callModel(sessionId, {
      model,
      method: "unlink",
      args: [ids],
    });

    return result as boolean;
  }
}

export const odooClient = new OdooClient();
