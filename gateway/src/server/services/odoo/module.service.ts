import { env } from "../../../env.js";

export interface OdooModule {
  id: number;
  name: string;
  display_name: string;
  summary: string;
  description: string;
  state: "uninstalled" | "installed" | "to upgrade" | "to remove" | "to install";
  category_id: [number, string];
  icon: string;
}

export interface OdooModuleInstallParams {
  database: string;
  modules: string[];
  uid: number;
  sessionId: string;
}

export interface OdooModuleUninstallParams {
  database: string;
  modules: string[];
  uid: number;
  sessionId: string;
}

export class OdooModuleService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || env.ODOO_URL;
  }

  /**
   * Authenticate with Odoo to get uid and session_id
   */
  async authenticate(
    database: string,
    login: string,
    password: string,
  ): Promise<{ uid: number; session_id: string }> {
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
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to authenticate with Odoo: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    if (!data.result || !data.result.uid) {
      throw new Error("Authentication failed: Invalid credentials");
    }

    return {
      uid: data.result.uid,
      session_id: data.result.session_id || "",
    };
  }

  /**
   * Get all available modules from Odoo
   */
  async getAvailableModules(database: string, uid: number, sessionId: string): Promise<OdooModule[]> {
    const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "ir.module.module",
          method: "search_read",
          args: [
            [], // Empty domain to get all modules
            ["name", "display_name", "summary", "description", "state", "category_id", "icon"],
          ],
          kwargs: {
            context: { lang: "en_US" },
          },
        },
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Odoo modules: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result || [];
  }

  /**
   * Get installed modules from Odoo
   */
  async getInstalledModules(database: string, uid: number, sessionId: string): Promise<OdooModule[]> {
    const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "ir.module.module",
          method: "search_read",
          args: [
            [["state", "=", "installed"]], // Only installed modules
            ["name", "display_name", "summary", "description", "state", "category_id", "icon"],
          ],
          kwargs: {
            context: { lang: "en_US" },
          },
        },
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch installed Odoo modules: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result || [];
  }

  /**
   * Install Odoo modules in a database
   * Uses Odoo's button_immediate_install method
   */
  async installModules(params: OdooModuleInstallParams): Promise<void> {
    const { database, modules, uid, sessionId } = params;

    // First, find the module IDs
    const moduleRecords = await this.getModulesByName(database, modules, uid, sessionId);

    if (moduleRecords.length === 0) {
      throw new Error(`No modules found with names: ${modules.join(", ")}`);
    }

    const moduleIds = moduleRecords.map((m) => m.id);

    // Call button_immediate_install on the modules
    const response = await fetch(`${this.baseUrl}/web/dataset/call_button`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "ir.module.module",
          method: "button_immediate_install",
          args: [moduleIds],
          kwargs: {
            context: { lang: "en_US" },
          },
        },
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to install Odoo modules: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Installed modules ${modules.join(", ")} in database ${database}`);
  }

  /**
   * Uninstall Odoo modules from a database
   * Uses Odoo's button_immediate_uninstall method
   */
  async uninstallModules(params: OdooModuleUninstallParams): Promise<void> {
    const { database, modules, uid, sessionId } = params;

    // First, find the module IDs
    const moduleRecords = await this.getModulesByName(database, modules, uid, sessionId);

    if (moduleRecords.length === 0) {
      throw new Error(`No modules found with names: ${modules.join(", ")}`);
    }

    const moduleIds = moduleRecords.map((m) => m.id);

    // Call button_immediate_uninstall on the modules
    const response = await fetch(`${this.baseUrl}/web/dataset/call_button`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "ir.module.module",
          method: "button_immediate_uninstall",
          args: [moduleIds],
          kwargs: {
            context: { lang: "en_US" },
          },
        },
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to uninstall Odoo modules: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Uninstalled modules ${modules.join(", ")} from database ${database}`);
  }

  /**
   * Get module records by name
   */
  private async getModulesByName(
    database: string,
    moduleNames: string[],
    uid: number,
    sessionId: string,
  ): Promise<OdooModule[]> {
    const response = await fetch(`${this.baseUrl}/web/dataset/call_kw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${sessionId}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "call",
        params: {
          model: "ir.module.module",
          method: "search_read",
          args: [[["name", "in", moduleNames]], ["id", "name", "display_name", "state"]],
          kwargs: {
            context: { lang: "en_US" },
          },
        },
        id: Math.random(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Odoo modules by name: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Odoo error: ${data.error.message || JSON.stringify(data.error)}`);
    }

    return data.result || [];
  }

  /**
   * Map Safee service names to Odoo module names
   */
  private mapServiceToOdooModule(serviceName: string): string {
    const mapping: Record<string, string> = {
      account: "account", // Accounting module
      sales: "sale",
      crm: "crm",
      purchase: "purchase",
      inventory: "stock",
      mrp: "mrp",
      hr: "hr",
      payroll: "hr_payroll",
      recruitment: "hr_recruitment",
      expenses: "hr_expense",
      project: "project",
      timesheet: "hr_timesheet",
      website: "website",
      ecommerce: "website_sale",
      point_of_sale: "point_of_sale",
      marketing: "marketing_automation",
      email_marketing: "mass_mailing",
      helpdesk: "helpdesk",
      planning: "planning",
      field_service: "industry_fsm",
    };

    return mapping[serviceName] || serviceName;
  }

  /**
   * Check if a module is installed in an Odoo database
   */
  async isModuleInstalled(_database: string, _moduleName: string): Promise<boolean> {
    // This would check via Odoo's API
    // For now, return true as base modules are installed by default
    return true;
  }
}

export const odooModuleService = new OdooModuleService();
