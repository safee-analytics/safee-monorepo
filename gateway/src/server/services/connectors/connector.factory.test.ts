import { describe, it, expect } from "vitest";
import { ConnectorFactory } from "./connector.factory.js";
import type { ConnectorMetadata } from "./base.connector.js";
import type { PostgreSQLConfig } from "./postgresql.connector.js";
import type { MySQLConfig } from "./mysql.connector.js";
import type { MSSQLConnectorConfig } from "./mssql.connector.js";
import { PostgreSQLConnector } from "./postgresql.connector.js";
import { MySQLConnector } from "./mysql.connector.js";
import { MSSQLConnector } from "./mssql.connector.js";

describe("ConnectorFactory", () => {
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

  describe("create", () => {
    it("should create PostgreSQL connector", () => {
      const config: PostgreSQLConfig = {
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const metadata = { ...mockMetadata, type: "postgresql" as const };
      const connector = ConnectorFactory.create(metadata, config);

      expect(connector).toBeInstanceOf(PostgreSQLConnector);
      expect(connector.getMetadata()).toEqual(metadata);
    });

    it("should create MySQL connector", () => {
      const config: MySQLConfig = {
        host: "localhost",
        port: 3306,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const metadata = { ...mockMetadata, type: "mysql" as const };
      const connector = ConnectorFactory.create(metadata, config);

      expect(connector).toBeInstanceOf(MySQLConnector);
      expect(connector.getMetadata()).toEqual(metadata);
    });

    it("should create MSSQL connector", () => {
      const config: MSSQLConnectorConfig = {
        host: "localhost",
        port: 1433,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const metadata = { ...mockMetadata, type: "mssql" as const };
      const connector = ConnectorFactory.create(metadata, config);

      expect(connector).toBeInstanceOf(MSSQLConnector);
      expect(connector.getMetadata()).toEqual(metadata);
    });

    it("should throw error for unsupported connector type", () => {
      const metadata = { ...mockMetadata, type: "unknown" as never };
      const config = {} as never;

      expect(() => ConnectorFactory.create(metadata, config)).toThrow("Unsupported connector type");
    });
  });

  describe("getAvailableTypes", () => {
    it("should return all available connector types", () => {
      const types = ConnectorFactory.getAvailableTypes();

      expect(types).toHaveLength(3);
      expect(types.map((t) => t.type)).toEqual(["postgresql", "mysql", "mssql"]);
      expect(types.every((t) => t.requiredFields.length > 0)).toBe(true);
    });

    it("should have proper field definitions for each type", () => {
      const types = ConnectorFactory.getAvailableTypes();

      for (const type of types) {
        expect(type).toHaveProperty("name");
        expect(type).toHaveProperty("description");
        expect(type).toHaveProperty("requiredFields");
        expect(type).toHaveProperty("optionalFields");
        expect(type.requiredFields).toContain("host");
        expect(type.requiredFields).toContain("port");
        expect(type.requiredFields).toContain("database");
        expect(type.requiredFields).toContain("username");
        expect(type.requiredFields).toContain("password");
      }
    });
  });

  describe("getFieldDefinitions", () => {
    it("should return PostgreSQL field definitions", () => {
      const fields = ConnectorFactory.getFieldDefinitions("postgresql");

      expect(fields.length).toBeGreaterThan(0);
      expect(fields.find((f) => f.name === "host")).toBeDefined();
      expect(fields.find((f) => f.name === "port")).toHaveProperty("defaultValue", 5432);
    });

    it("should return MySQL field definitions", () => {
      const fields = ConnectorFactory.getFieldDefinitions("mysql");

      expect(fields.length).toBeGreaterThan(0);
      expect(fields.find((f) => f.name === "port")).toHaveProperty("defaultValue", 3306);
    });

    it("should return MSSQL field definitions", () => {
      const fields = ConnectorFactory.getFieldDefinitions("mssql");

      expect(fields.length).toBeGreaterThan(0);
      expect(fields.find((f) => f.name === "port")).toHaveProperty("defaultValue", 1433);
      expect(fields.find((f) => f.name === "encrypt")).toBeDefined();
      expect(fields.find((f) => f.name === "trustServerCertificate")).toBeDefined();
    });

    it("should mark required fields correctly", () => {
      const fields = ConnectorFactory.getFieldDefinitions("postgresql");
      const requiredFields = fields.filter((f) => f.required);

      expect(requiredFields.map((f) => f.name)).toEqual(
        expect.arrayContaining(["host", "port", "database", "username", "password"]),
      );
    });

    it("should include help text for fields", () => {
      const fields = ConnectorFactory.getFieldDefinitions("postgresql");

      for (const field of fields) {
        if (field.required) {
          expect(field.helpText).toBeDefined();
          expect(field.helpText!.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("validateConfig", () => {
    it("should validate valid PostgreSQL config", async () => {
      const config: PostgreSQLConfig = {
        host: "localhost",
        port: 5432,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const result = await ConnectorFactory.validateConfig("postgresql", config);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("should reject invalid PostgreSQL config - missing host", async () => {
      const config = {
        port: 5432,
        database: "testdb",
        username: "user",
        password: "pass",
      } as PostgreSQLConfig;

      const result = await ConnectorFactory.validateConfig("postgresql", config);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors).toContain("Host is required");
    });

    it("should reject invalid port number", async () => {
      const config: PostgreSQLConfig = {
        host: "localhost",
        port: 99999,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const result = await ConnectorFactory.validateConfig("postgresql", config);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.includes("Port"))).toBe(true);
    });

    it("should validate valid MySQL config", async () => {
      const config: MySQLConfig = {
        host: "localhost",
        port: 3306,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const result = await ConnectorFactory.validateConfig("mysql", config);

      expect(result.valid).toBe(true);
    });

    it("should validate valid MSSQL config", async () => {
      const config: MSSQLConnectorConfig = {
        host: "localhost",
        port: 1433,
        database: "testdb",
        username: "user",
        password: "pass",
      };

      const result = await ConnectorFactory.validateConfig("mssql", config);

      expect(result.valid).toBe(true);
    });
  });
});
