import { env } from "../../../env.js";
import { BadGateway } from "../../errors.js";
import xmlrpc from "xmlrpc";

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
  private host: string;
  private port: number;
  private isSecure: boolean;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.ODOO_URL;
    const url = new URL(this.baseUrl);
    this.host = url.hostname;
    this.port = url.port ? parseInt(url.port) : url.protocol === "https:" ? 443 : 80;
    this.isSecure = url.protocol === "https:";
  }

  private createDbClient(): xmlrpc.Client {
    const options = {
      host: this.host,
      port: this.port,
      path: "/xmlrpc/2/db",
    };

    return this.isSecure ? xmlrpc.createSecureClient(options) : xmlrpc.createClient(options);
  }

  private async callDbMethod(method: string, args: unknown[]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const client = this.createDbClient();
      client.methodCall(method, args, (error, value) => {
        if (error) {
          const errorMessage =
            error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
          reject(new BadGateway(`Odoo database ${method} error: ${errorMessage}`));
        } else {
          resolve(value);
        }
      });
    });
  }

  async createDatabase(params: CreateDatabaseParams): Promise<OdooDatabase> {
    await this.callDbMethod("create_database", [
      params.masterPassword,
      params.name,
      false, // demo data
      params.lang || "en_US",
      params.adminPassword,
      params.adminLogin,
      params.countryCode || "SA",
      params.phone || "",
    ]);

    return {
      name: params.name,
      created: true,
    };
  }

  async listDatabases(): Promise<string[]> {
    const result = await this.callDbMethod("list", []);
    return result as string[];
  }

  async databaseExists(name: string): Promise<boolean> {
    const databases = await this.listDatabases();
    return databases.includes(name);
  }

  async dropDatabase(masterPassword: string, name: string): Promise<void> {
    await this.callDbMethod("drop", [masterPassword, name]);
  }
}

export const odooClient = new OdooClient();
