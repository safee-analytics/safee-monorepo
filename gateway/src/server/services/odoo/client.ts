import { env } from "../../../env.js";

export interface OdooAuthResponse {
  uid: number;
  session_id: string;
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

export class OdooClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.ODOO_URL;
  }

  async createDatabase(params: CreateDatabaseParams): Promise<OdooDatabase> {
    const response = await fetch(`${this.baseUrl}/web/database/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          master_pwd: params.masterPassword,
          name: params.name,
          login: params.adminLogin,
          password: params.adminPassword,
          lang: params.lang || "en_US",
          country_code: params.countryCode || "SA",
          phone: params.phone || "",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Odoo database: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return {
      name: params.name,
      created: true,
    };
  }

  async listDatabases(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/web/database/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list Odoo databases: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result || [];
  }

  async authenticate(database: string, login: string, password: string): Promise<OdooAuthResponse> {
    const response = await fetch(`${this.baseUrl}/web/session/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          db: database,
          login,
          password,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to authenticate with Odoo: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result;
  }

  async databaseExists(name: string): Promise<boolean> {
    const databases = await this.listDatabases();
    return databases.includes(name);
  }

  async dropDatabase(masterPassword: string, name: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/web/database/drop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          master_pwd: masterPassword,
          name,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to drop Odoo database: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }
  }
}

export const odooClient = new OdooClient();
