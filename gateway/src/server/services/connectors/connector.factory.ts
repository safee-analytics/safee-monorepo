import type { ConnectorType, ConnectorMetadata, ConnectorConfig, IConnector } from "./base.connector.js";
import { PostgreSQLConnector, type PostgreSQLConfig } from "./postgresql.connector.js";
import { MySQLConnector, type MySQLConfig } from "./mysql.connector.js";
import { MSSQLConnector, type MSSQLConnectorConfig } from "./mssql.connector.js";

/**
 * Factory for creating connector instances based on type
 */
export class ConnectorFactory {
  static create(
    metadata: ConnectorMetadata,
    config: PostgreSQLConfig | MySQLConfig | MSSQLConnectorConfig,
  ): IConnector {
    switch (metadata.type) {
      case "postgresql":
        return new PostgreSQLConnector(metadata, config);

      case "mysql":
        return new MySQLConnector(metadata, config);

      case "mssql":
        return new MSSQLConnector(metadata, config);

      // Add more connector types as they are implemented
      // case "mongodb":
      //   return new MongoDBConnector(metadata, config);

      // case "odoo":
      //   return new OdooConnector(metadata, config);

      default:
        throw new Error(`Unsupported connector type: ${metadata.type}`);
    }
  }

  /**
   * Get available connector types
   */
  static getAvailableTypes(): Array<{
    type: ConnectorType;
    name: string;
    description: string;
    requiredFields: string[];
    optionalFields: string[];
  }> {
    return [
      {
        type: "postgresql",
        name: "PostgreSQL",
        description: "Connect to PostgreSQL databases",
        requiredFields: ["host", "port", "database", "username", "password"],
        optionalFields: ["ssl", "maxConnections", "connectionTimeout"],
      },
      {
        type: "mysql",
        name: "MySQL",
        description: "Connect to MySQL/MariaDB databases",
        requiredFields: ["host", "port", "database", "username", "password"],
        optionalFields: ["ssl", "maxConnections", "connectionTimeout"],
      },
      {
        type: "mssql",
        name: "Microsoft SQL Server",
        description: "Connect to MSSQL/SQL Server databases",
        requiredFields: ["host", "port", "database", "username", "password"],
        optionalFields: [
          "encrypt",
          "trustServerCertificate",
          "maxConnections",
          "connectionTimeout",
          "requestTimeout",
        ],
      },
    ];
  }

  /**
   * Get field definitions for a specific connector type
   */
  static getFieldDefinitions(type: ConnectorType): Array<{
    name: string;
    type: "text" | "number" | "password" | "boolean";
    label: string;
    placeholder?: string;
    required: boolean;
    defaultValue?: any;
    helpText?: string;
  }> {
    const commonDatabaseFields = [
      {
        name: "host",
        type: "text" as const,
        label: "Host",
        placeholder: "localhost",
        required: true,
        helpText: "Database server hostname or IP address",
      },
      {
        name: "port",
        type: "number" as const,
        label: "Port",
        required: true,
        helpText: "Database server port",
      },
      {
        name: "database",
        type: "text" as const,
        label: "Database",
        placeholder: "my_database",
        required: true,
        helpText: "Database name to connect to",
      },
      {
        name: "username",
        type: "text" as const,
        label: "Username",
        required: true,
        helpText: "Database user with access permissions",
      },
      {
        name: "password",
        type: "password" as const,
        label: "Password",
        required: true,
        helpText: "Database user password",
      },
      {
        name: "ssl",
        type: "boolean" as const,
        label: "Use SSL",
        required: false,
        defaultValue: false,
        helpText: "Enable SSL/TLS encryption for the connection",
      },
      {
        name: "maxConnections",
        type: "number" as const,
        label: "Max Connections",
        required: false,
        defaultValue: 10,
        helpText: "Maximum number of concurrent connections in the pool",
      },
      {
        name: "connectionTimeout",
        type: "number" as const,
        label: "Connection Timeout (ms)",
        required: false,
        defaultValue: 5000,
        helpText: "Timeout in milliseconds for establishing a connection",
      },
    ];

    switch (type) {
      case "postgresql":
        return [
          ...commonDatabaseFields.map((f) =>
            f.name === "port" ? { ...f, placeholder: "5432", defaultValue: 5432 } : f,
          ),
        ];

      case "mysql":
        return [
          ...commonDatabaseFields.map((f) =>
            f.name === "port" ? { ...f, placeholder: "3306", defaultValue: 3306 } : f,
          ),
        ];

      case "mssql":
        return [
          ...commonDatabaseFields.map((f) =>
            f.name === "port" ? { ...f, placeholder: "1433", defaultValue: 1433 } : f,
          ),
          {
            name: "encrypt",
            type: "boolean" as const,
            label: "Encrypt Connection",
            required: false,
            defaultValue: true,
            helpText: "Encrypt the connection (recommended for production)",
          },
          {
            name: "trustServerCertificate",
            type: "boolean" as const,
            label: "Trust Server Certificate",
            required: false,
            defaultValue: false,
            helpText: "Trust self-signed certificates (use with caution)",
          },
          {
            name: "requestTimeout",
            type: "number" as const,
            label: "Request Timeout (ms)",
            required: false,
            defaultValue: 15000,
            helpText: "Timeout in milliseconds for query execution",
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Validate connector config before creation
   */
  static async validateConfig(
    type: ConnectorType,
    config: PostgreSQLConfig | MySQLConfig | MSSQLConnectorConfig,
  ): Promise<{
    valid: boolean;
    errors?: string[];
  }> {
    // Create a temporary connector instance for validation
    const tempMetadata: ConnectorMetadata = {
      id: "temp",
      organizationId: "temp",
      name: "temp",
      type,
      isActive: true,
      tags: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const connector = ConnectorFactory.create(tempMetadata, config);
      return await connector.validateConfig(config);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
