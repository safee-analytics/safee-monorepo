import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataMapperService, type FieldMapping, type TableMapping } from "./data-mapper.service.js";
import type { DataProxyService } from "./data-proxy.service.js";

describe("DataMapperService", () => {
  let dataMapperService: DataMapperService;
  let mockDataProxyService: DataProxyService;

  beforeEach(() => {
    mockDataProxyService = {
      executePaginatedQuery: vi.fn(),
      getSchema: vi.fn(),
      getTablePreview: vi.fn(),
    } as unknown as DataProxyService;

    dataMapperService = new DataMapperService(mockDataProxyService);
  });

  describe("suggestMappings", () => {
    it("should suggest mappings for contact entity", () => {
      const sourceColumns = ["id", "name", "email", "phone", "company"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "contact");

      expect(mappings).toHaveLength(5);
      expect(mappings.find((m) => m.sourceColumn === "id")).toHaveProperty("targetField", "externalId");
      expect(mappings.find((m) => m.sourceColumn === "name")).toHaveProperty("targetField", "name");
      expect(mappings.find((m) => m.sourceColumn === "email")).toHaveProperty("targetField", "email");
      expect(mappings.find((m) => m.sourceColumn === "phone")).toHaveProperty("targetField", "phone");
      expect(mappings.find((m) => m.sourceColumn === "company")).toHaveProperty("targetField", "company");
    });

    it("should suggest mappings for deal entity", () => {
      const sourceColumns = ["deal_id", "title", "amount", "stage", "close_date"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "deal");

      expect(mappings).toHaveLength(5);
      expect(mappings.find((m) => m.sourceColumn === "deal_id")).toHaveProperty("targetField", "externalId");
      expect(mappings.find((m) => m.sourceColumn === "title")).toHaveProperty("targetField", "title");
      expect(mappings.find((m) => m.sourceColumn === "amount")).toHaveProperty("targetField", "value");
      expect(mappings.find((m) => m.sourceColumn === "stage")).toHaveProperty("targetField", "stage");
      expect(mappings.find((m) => m.sourceColumn === "close_date")).toHaveProperty(
        "targetField",
        "closeDate",
      );
    });

    it("should suggest mappings for employee entity", () => {
      const sourceColumns = ["employee_id", "first_name", "last_name", "email", "department"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "employee");

      expect(mappings).toHaveLength(5);
      expect(mappings.find((m) => m.sourceColumn === "employee_id")).toHaveProperty(
        "targetField",
        "externalId",
      );
      expect(mappings.find((m) => m.sourceColumn === "first_name")).toHaveProperty(
        "targetField",
        "firstName",
      );
      expect(mappings.find((m) => m.sourceColumn === "last_name")).toHaveProperty("targetField", "lastName");
    });

    it("should suggest mappings for invoice entity", () => {
      const sourceColumns = ["invoice_id", "invoice_number", "amount", "customer_id", "due_date"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "invoice");

      expect(mappings).toHaveLength(5);
      expect(mappings.find((m) => m.sourceColumn === "invoice_id")).toHaveProperty(
        "targetField",
        "externalId",
      );
      expect(mappings.find((m) => m.sourceColumn === "invoice_number")).toHaveProperty(
        "targetField",
        "invoiceNumber",
      );
      expect(mappings.find((m) => m.sourceColumn === "amount")).toHaveProperty("targetField", "amount");
      expect(mappings.find((m) => m.sourceColumn === "customer_id")).toHaveProperty(
        "targetField",
        "contactId",
      );
      expect(mappings.find((m) => m.sourceColumn === "due_date")).toHaveProperty("targetField", "dueDate");
    });

    it("should add lowercase transform for email fields", () => {
      const sourceColumns = ["email", "email_address"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "contact");

      expect(mappings.every((m) => m.transform === "lowercase")).toBe(true);
    });

    it("should add date transform for date fields", () => {
      const sourceColumns = ["created_at", "updated_at", "close_date"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "deal");

      mappings.forEach((m) => {
        expect(m.transform).toBe("date");
      });
    });

    it("should add number transform for numeric fields", () => {
      const sourceColumns = ["amount", "value", "salary"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "invoice");

      mappings.forEach((m) => {
        expect(m.transform).toBe("number");
      });
    });

    it("should handle columns with underscores and hyphens", () => {
      const sourceColumns = ["first_name", "last-name", "email address"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "contact");

      expect(mappings.find((m) => m.sourceColumn === "first_name")).toBeDefined();
    });

    it("should return empty array for unmatched columns", () => {
      const sourceColumns = ["unknown_column_1", "random_field_2"];
      const mappings = dataMapperService.suggestMappings(sourceColumns, "contact");

      expect(mappings).toHaveLength(0);
    });
  });

  describe("transformRow", () => {
    it("should transform row based on mappings", () => {
      const sourceRow = {
        id: "123",
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        amount: "100.50",
      };

      const mappings: FieldMapping[] = [
        { sourceColumn: "id", targetField: "externalId" },
        { sourceColumn: "name", targetField: "name" },
        { sourceColumn: "email", targetField: "email", transform: "lowercase" },
        { sourceColumn: "amount", targetField: "value", transform: "number" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed).toEqual({
        externalId: "123",
        name: "John Doe",
        email: "john@example.com",
        value: 100.5,
      });
    });

    it("should apply lowercase transform", () => {
      const sourceRow = { email: "TEST@EXAMPLE.COM" };
      const mappings: FieldMapping[] = [
        { sourceColumn: "email", targetField: "email", transform: "lowercase" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.email).toBe("test@example.com");
    });

    it("should apply uppercase transform", () => {
      const sourceRow = { code: "abc123" };
      const mappings: FieldMapping[] = [
        { sourceColumn: "code", targetField: "code", transform: "uppercase" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.code).toBe("ABC123");
    });

    it("should apply trim transform", () => {
      const sourceRow = { name: "  John Doe  " };
      const mappings: FieldMapping[] = [{ sourceColumn: "name", targetField: "name", transform: "trim" }];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.name).toBe("John Doe");
    });

    it("should apply date transform from string", () => {
      const sourceRow = { created_at: "2024-01-15T10:30:00Z" };
      const mappings: FieldMapping[] = [
        { sourceColumn: "created_at", targetField: "createdAt", transform: "date" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.createdAt).toBeInstanceOf(Date);
      expect((transformed.createdAt as Date).toISOString()).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should apply date transform from number (timestamp)", () => {
      const timestamp = 1705318200000; // 2024-01-15T10:30:00.000Z
      const sourceRow = { created_at: timestamp };
      const mappings: FieldMapping[] = [
        { sourceColumn: "created_at", targetField: "createdAt", transform: "date" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.createdAt).toBeInstanceOf(Date);
      expect((transformed.createdAt as Date).getTime()).toBe(timestamp);
    });

    it("should apply number transform", () => {
      const sourceRow = { amount: "123.45" };
      const mappings: FieldMapping[] = [
        { sourceColumn: "amount", targetField: "amount", transform: "number" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.amount).toBe(123.45);
      expect(typeof transformed.amount).toBe("number");
    });

    it("should apply boolean transform", () => {
      const sourceRow = { active: "true", enabled: 1, disabled: 0 };
      const mappings: FieldMapping[] = [
        { sourceColumn: "active", targetField: "active", transform: "boolean" },
        { sourceColumn: "enabled", targetField: "enabled", transform: "boolean" },
        { sourceColumn: "disabled", targetField: "disabled", transform: "boolean" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.active).toBe(true);
      expect(transformed.enabled).toBe(true);
      expect(transformed.disabled).toBe(false);
    });

    it("should use default value when source is null", () => {
      const sourceRow = { value: null };
      const mappings: FieldMapping[] = [
        { sourceColumn: "value", targetField: "value", defaultValue: "default" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.value).toBe("default");
    });

    it("should use default value when source is undefined", () => {
      const sourceRow = {};
      const mappings: FieldMapping[] = [{ sourceColumn: "missing", targetField: "field", defaultValue: 0 }];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed.field).toBe(0);
    });

    it("should skip field if value is null and no default", () => {
      const sourceRow = { value: null };
      const mappings: FieldMapping[] = [{ sourceColumn: "value", targetField: "value" }];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed).not.toHaveProperty("value");
    });

    it("should handle multiple transforms on different fields", () => {
      const sourceRow = {
        email: "TEST@EXAMPLE.COM",
        name: "  john doe  ",
        amount: "50.25",
        active: 1,
      };

      const mappings: FieldMapping[] = [
        { sourceColumn: "email", targetField: "email", transform: "lowercase" },
        { sourceColumn: "name", targetField: "name", transform: "trim" },
        { sourceColumn: "amount", targetField: "amount", transform: "number" },
        { sourceColumn: "active", targetField: "active", transform: "boolean" },
      ];

      const transformed = dataMapperService.transformRow(sourceRow, mappings);

      expect(transformed).toEqual({
        email: "test@example.com",
        name: "john doe",
        amount: 50.25,
        active: true,
      });
    });
  });

  describe("fetchMappedData", () => {
    it("should fetch and transform data", async () => {
      const mockData = {
        rows: [
          { id: "1", name: "John", email: "JOHN@TEST.COM" },
          { id: "2", name: "Jane", email: "JANE@TEST.COM" },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        hasMore: false,
      };

      vi.mocked(mockDataProxyService.executePaginatedQuery).mockResolvedValue(mockData);

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "users",
        targetEntity: "contact",
        fieldMappings: [
          { sourceColumn: "id", targetField: "externalId" },
          { sourceColumn: "name", targetField: "name" },
          { sourceColumn: "email", targetField: "email", transform: "lowercase" },
        ],
        syncEnabled: false,
      };

      const result = await dataMapperService.fetchMappedData("org-1", mapping);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.data[0]).toEqual({
        externalId: "1",
        name: "John",
        email: "john@test.com",
      });
    });
  });

  describe("previewMapping", () => {
    it("should return both source and transformed data", async () => {
      const mockData = {
        rows: [{ id: "1", name: "John", amount: "100" }],
        total: 1,
        page: 1,
        pageSize: 10,
        hasMore: false,
      };

      vi.mocked(mockDataProxyService.executePaginatedQuery).mockResolvedValue(mockData);

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "deals",
        targetEntity: "deal",
        fieldMappings: [
          { sourceColumn: "id", targetField: "externalId" },
          { sourceColumn: "name", targetField: "title" },
          { sourceColumn: "amount", targetField: "value", transform: "number" },
        ],
        syncEnabled: false,
      };

      const result = await dataMapperService.previewMapping("org-1", mapping, 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty("source");
      expect(result[0]).toHaveProperty("target");
      expect(result[0].source).toEqual({ id: "1", name: "John", amount: "100" });
      expect(result[0].target).toEqual({ externalId: "1", title: "John", value: 100 });
    });
  });

  describe("validateMapping", () => {
    it("should validate successful mapping", async () => {
      vi.mocked(mockDataProxyService.getSchema).mockResolvedValue({
        tables: [{ schema: "public", name: "users", type: "table" }],
      });

      vi.mocked(mockDataProxyService.getTablePreview).mockResolvedValue({
        schema: "public",
        table: "users",
        columns: [
          { name: "id", type: "uuid", nullable: false },
          { name: "name", type: "varchar", nullable: false },
          { name: "email", type: "varchar", nullable: true },
        ],
        sampleData: [],
        totalRows: 0,
      });

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "users",
        targetEntity: "contact",
        fieldMappings: [
          { sourceColumn: "id", targetField: "externalId" },
          { sourceColumn: "name", targetField: "name" },
          { sourceColumn: "email", targetField: "email" },
        ],
        syncEnabled: false,
      };

      const result = await dataMapperService.validateMapping("org-1", mapping);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing table", async () => {
      vi.mocked(mockDataProxyService.getSchema).mockResolvedValue({
        tables: [{ schema: "public", name: "other_table", type: "table" }],
      });

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "users",
        targetEntity: "contact",
        fieldMappings: [],
        syncEnabled: false,
      };

      const result = await dataMapperService.validateMapping("org-1", mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Table public.users not found in connector");
    });

    it("should detect missing source columns", async () => {
      vi.mocked(mockDataProxyService.getSchema).mockResolvedValue({
        tables: [{ schema: "public", name: "users", type: "table" }],
      });

      vi.mocked(mockDataProxyService.getTablePreview).mockResolvedValue({
        schema: "public",
        table: "users",
        columns: [{ name: "id", type: "uuid", nullable: false }],
        sampleData: [],
        totalRows: 0,
      });

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "users",
        targetEntity: "contact",
        fieldMappings: [
          { sourceColumn: "id", targetField: "externalId" },
          { sourceColumn: "nonexistent_column", targetField: "name" },
        ],
        syncEnabled: false,
      };

      const result = await dataMapperService.validateMapping("org-1", mapping);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Source column 'nonexistent_column' not found in table");
    });

    it("should warn about unmapped columns", async () => {
      vi.mocked(mockDataProxyService.getSchema).mockResolvedValue({
        tables: [{ schema: "public", name: "users", type: "table" }],
      });

      vi.mocked(mockDataProxyService.getTablePreview).mockResolvedValue({
        schema: "public",
        table: "users",
        columns: [
          { name: "id", type: "uuid", nullable: false },
          { name: "name", type: "varchar", nullable: false },
          { name: "email", type: "varchar", nullable: true },
          { name: "phone", type: "varchar", nullable: true },
          { name: "address", type: "varchar", nullable: true },
        ],
        sampleData: [],
        totalRows: 0,
      });

      const mapping: TableMapping = {
        id: "mapping-1",
        connectorId: "conn-1",
        sourceSchema: "public",
        sourceTable: "users",
        targetEntity: "contact",
        fieldMappings: [{ sourceColumn: "id", targetField: "externalId" }],
        syncEnabled: false,
      };

      const result = await dataMapperService.validateMapping("org-1", mapping);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("columns are not mapped");
    });
  });
});
