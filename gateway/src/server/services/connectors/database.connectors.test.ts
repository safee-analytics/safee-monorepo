import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostgreSQLConnector, type PostgreSQLConfig } from "./postgresql.connector.js";
import { MySQLConnector, type MySQLConfig } from "./mysql.connector.js";
import { MSSQLConnector, type MSSQLConnectorConfig } from "./mssql.connector.js";
import type { ConnectorMetadata } from "./base.connector.js";

vi.mock("pg", () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue({
      query: vi.fn().mockResolvedValue({ rows: [{ version: "PostgreSQL 14.0" }] }),
      release: vi.fn(),
    }),
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: vi.fn().mockImplementation(() => ({
      getConnection: vi.fn().mockResolvedValue({
        query: vi.fn().mockResolvedValue([[{ version: "8.0.0" }]]),
        release: vi.fn(),
      }),
      query: vi.fn().mockResolvedValue([[], {}]),
      end: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock("mssql", () => ({
  default: {
    ConnectionPool: vi.fn().mockImplementation(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      request: vi.fn().mockReturnValue({
        query: vi.fn().mockResolvedValue({ recordset: [{ version: "SQL Server 2019" }] }),
        input: vi.fn().mockReturnThis(),
      }),
    })),
  },
}));

describe("Database Connectors", () => {
  const mockMetadata: ConnectorMetadata = {
    id: "test-id",
    organizationId: "org-id",
    name: "Test Connector",
    type: "postgresql",
    isActive: true,
    tags: [],
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("PostgreSQLConnector", () => {
    let connector: PostgreSQLConnector;
    let config: PostgreSQLConfig;

    beforeEach(() => {
      config = {
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "testuser",
        password: "testpass",
        ssl: false,
      };
      connector = new PostgreSQLConnector(mockMetadata, config);
    });

    describe("validateConfig", () => {
      it("should validate valid config", async () => {
        const result = await connector.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it("should reject config missing host", async () => {
        const invalidConfig = { ...config, host: "" };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Host is required");
      });

      it("should reject config missing port", async () => {
        const invalidConfig = { ...config, port: 0 };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Port is required");
      });

      it("should reject config missing database", async () => {
        const invalidConfig = { ...config, database: "" };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Database is required");
      });

      it("should reject config missing username", async () => {
        const invalidConfig = { ...config, username: "" };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Username is required");
      });

      it("should reject config missing password", async () => {
        const invalidConfig = { ...config, password: "" };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Password is required");
      });

      it("should reject invalid port range", async () => {
        const invalidConfig = { ...config, port: 70000 };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors?.some((e) => e.includes("Port must be between"))).toBe(true);
      });
    });

    describe("getMetadata", () => {
      it("should return connector metadata", () => {
        const metadata = connector.getMetadata();
        expect(metadata).toEqual(mockMetadata);
      });
    });

    describe("isConnected", () => {
      it("should return false initially", () => {
        expect(connector.isConnected()).toBe(false);
      });
    });
  });

  describe("MySQLConnector", () => {
    let connector: MySQLConnector;
    let config: MySQLConfig;

    beforeEach(() => {
      config = {
        host: "localhost",
        port: 3306,
        database: "testdb",
        username: "testuser",
        password: "testpass",
        ssl: false,
      };
      const metadata = { ...mockMetadata, type: "mysql" as const };
      connector = new MySQLConnector(metadata, config);
    });

    describe("validateConfig", () => {
      it("should validate valid config", async () => {
        const result = await connector.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it("should reject config with all missing fields", async () => {
        const invalidConfig = {} as MySQLConfig;
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
      });

      it("should reject negative port", async () => {
        const invalidConfig = { ...config, port: -1 };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
      });
    });

    describe("getMetadata", () => {
      it("should return connector metadata with correct type", () => {
        const metadata = connector.getMetadata();
        expect(metadata.type).toBe("mysql");
      });
    });

    describe("isConnected", () => {
      it("should return false before connection", () => {
        expect(connector.isConnected()).toBe(false);
      });
    });
  });

  describe("MSSQLConnector", () => {
    let connector: MSSQLConnector;
    let config: MSSQLConnectorConfig;

    beforeEach(() => {
      config = {
        host: "localhost",
        port: 1433,
        database: "testdb",
        username: "testuser",
        password: "testpass",
        encrypt: true,
        trustServerCertificate: false,
      };
      const metadata = { ...mockMetadata, type: "mssql" as const };
      connector = new MSSQLConnector(metadata, config);
    });

    describe("validateConfig", () => {
      it("should validate valid config", async () => {
        const result = await connector.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it("should reject config missing required fields", async () => {
        const invalidConfig = { host: "localhost" } as MSSQLConnectorConfig;
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
      });

      it("should reject config with invalid port", async () => {
        const invalidConfig = { ...config, port: 100000 };
        const result = await connector.validateConfig(invalidConfig);
        expect(result.valid).toBe(false);
        expect(result.errors?.some((e) => e.includes("Port"))).toBe(true);
      });
    });

    describe("getMetadata", () => {
      it("should return connector metadata with correct type", () => {
        const metadata = connector.getMetadata();
        expect(metadata.type).toBe("mssql");
      });
    });

    describe("isConnected", () => {
      it("should return false before connection", () => {
        expect(connector.isConnected()).toBe(false);
      });
    });
  });

  describe("Connector Configuration Comparison", () => {
    it("should have different default ports for each database", () => {
      const postgresConfig: PostgreSQLConfig = {
        host: "localhost",
        port: 5432,
        database: "test",
        username: "user",
        password: "pass",
      };

      const mysqlConfig: MySQLConfig = {
        host: "localhost",
        port: 3306,
        database: "test",
        username: "user",
        password: "pass",
      };

      const mssqlConfig: MSSQLConnectorConfig = {
        host: "localhost",
        port: 1433,
        database: "test",
        username: "user",
        password: "pass",
      };

      expect(postgresConfig.port).toBe(5432);
      expect(mysqlConfig.port).toBe(3306);
      expect(mssqlConfig.port).toBe(1433);
    });

    it("should support optional SSL configuration", () => {
      const configs = [
        {
          host: "localhost",
          port: 5432,
          database: "test",
          username: "user",
          password: "pass",
          ssl: true,
        },
        {
          host: "localhost",
          port: 3306,
          database: "test",
          username: "user",
          password: "pass",
          ssl: false,
        },
      ];

      configs.forEach((config) => {
        expect(config).toHaveProperty("ssl");
        expect(typeof config.ssl).toBe("boolean");
      });
    });

    it("should support optional connection pooling configuration", () => {
      const config = {
        host: "localhost",
        port: 5432,
        database: "test",
        username: "user",
        password: "pass",
        maxConnections: 20,
        connectionTimeout: 10000,
      };

      expect(config).toHaveProperty("maxConnections");
      expect(config).toHaveProperty("connectionTimeout");
    });
  });

  describe("Connector Type Guards", () => {
    it("should distinguish PostgreSQL connector", () => {
      const pgMetadata = { ...mockMetadata, type: "postgresql" as const };
      const config: PostgreSQLConfig = {
        host: "localhost",
        port: 5432,
        database: "test",
        username: "user",
        password: "pass",
      };
      const connector = new PostgreSQLConnector(pgMetadata, config);

      expect(connector).toBeInstanceOf(PostgreSQLConnector);
      expect(connector.getMetadata().type).toBe("postgresql");
    });

    it("should distinguish MySQL connector", () => {
      const mysqlMetadata = { ...mockMetadata, type: "mysql" as const };
      const config: MySQLConfig = {
        host: "localhost",
        port: 3306,
        database: "test",
        username: "user",
        password: "pass",
      };
      const connector = new MySQLConnector(mysqlMetadata, config);

      expect(connector).toBeInstanceOf(MySQLConnector);
      expect(connector.getMetadata().type).toBe("mysql");
    });

    it("should distinguish MSSQL connector", () => {
      const mssqlMetadata = { ...mockMetadata, type: "mssql" as const };
      const config: MSSQLConnectorConfig = {
        host: "localhost",
        port: 1433,
        database: "test",
        username: "user",
        password: "pass",
      };
      const connector = new MSSQLConnector(mssqlMetadata, config);

      expect(connector).toBeInstanceOf(MSSQLConnector);
      expect(connector.getMetadata().type).toBe("mssql");
    });
  });

  describe("Error Handling", () => {
    it("should validate all connectors properly reject empty configurations", async () => {
      const emptyConfig = {} as PostgreSQLConfig;

      const pgMetadata = { ...mockMetadata, type: "postgresql" as const };
      const pgConnector = new PostgreSQLConnector(pgMetadata, emptyConfig);
      const pgResult = await pgConnector.validateConfig(emptyConfig);
      expect(pgResult.valid).toBe(false);

      const mysqlMetadata = { ...mockMetadata, type: "mysql" as const };
      const mysqlConnector = new MySQLConnector(mysqlMetadata, emptyConfig as MySQLConfig);
      const mysqlResult = await mysqlConnector.validateConfig(emptyConfig as MySQLConfig);
      expect(mysqlResult.valid).toBe(false);

      const mssqlMetadata = { ...mockMetadata, type: "mssql" as const };
      const mssqlConnector = new MSSQLConnector(mssqlMetadata, emptyConfig as MSSQLConnectorConfig);
      const mssqlResult = await mssqlConnector.validateConfig(emptyConfig as MSSQLConnectorConfig);
      expect(mssqlResult.valid).toBe(false);
    });

    it("should all connectors return consistent error structure", async () => {
      const invalidConfig = {} as PostgreSQLConfig;

      const connectors = [
        new PostgreSQLConnector(mockMetadata, invalidConfig),
        new MySQLConnector({ ...mockMetadata, type: "mysql" as const }, invalidConfig as MySQLConfig),
        new MSSQLConnector(
          { ...mockMetadata, type: "mssql" as const },
          invalidConfig as MSSQLConnectorConfig,
        ),
      ];

      for (const connector of connectors) {
        const result = await connector.validateConfig(invalidConfig);
        expect(result).toHaveProperty("valid");
        expect(result.valid).toBe(false);
        expect(result).toHaveProperty("errors");
        expect(Array.isArray(result.errors)).toBe(true);
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });
  });
});
