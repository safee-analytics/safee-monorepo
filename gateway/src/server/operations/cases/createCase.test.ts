import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { createCase } from "./createCase.js";
import { InvalidInput } from "../../errors.js";

void describe("createCase operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "create-case-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    // Create test data using helpers
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, testOrg.id);
  });

  afterAll(async () => {
    await close();
  });

  void it("should create a case successfully", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      clientName: "Test Client",
      auditType: "ICV",
    });

    expect(result.id).toBeDefined();
    expect(result.caseNumber).toBe("CASE-001");
    expect(result.clientName).toBe("Test Client");
    expect(result.auditType).toBe("ICV");
    expect(result.status).toBe("pending");
    expect(result.priority).toBe("medium");
    expect(result.organizationId).toBe(testOrg.id);
    expect(result.createdBy).toBe(testUser.id);
  });

  void it("should create a case with all optional fields", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      clientName: "Test Client 2",
      auditType: "ISO 9001",
      status: "in-progress",
      priority: "high",
      dueDate: tomorrow.toISOString(),
    });

    expect(result.status).toBe("in-progress");
    expect(result.priority).toBe("high");
    expect(result.dueDate).toBeDefined();
  });

  void it("should create history entry on case creation", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      clientName: "Test Client 3",
      auditType: "ICV",
    });

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(eq(schema.caseHistory.caseId, result.id));

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("created");
    expect(history[0].changedBy).toBe(testUser.id);
    expect(history[0].changesAfter).toMatchObject({
      caseNumber: "CASE-003",
      clientName: "Test Client 3",
    });
  });

  void it("should trim whitespace from client name and audit type", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      clientName: "  Test Client  ",
      auditType: "  ICV  ",
    });

    expect(result.clientName).toBe("Test Client");
    expect(result.auditType).toBe("ICV");
  });

  void it("should reject invalid case number format", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "case-001", // lowercase
        clientName: "Test Client",
        auditType: "ICV",
      }),
    ).rejects.toThrow(InvalidInput);

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE 001", // space
        clientName: "Test Client",
        auditType: "ICV",
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should reject case number that is too short", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "C1",
        clientName: "Test Client",
        auditType: "ICV",
      }),
    ).rejects.toThrow("Case number must be between 3 and 50 characters");
  });

  void it("should reject case number that is too long", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "C".repeat(51),
        clientName: "Test Client",
        auditType: "ICV",
      }),
    ).rejects.toThrow("Case number must be between 3 and 50 characters");
  });

  void it("should reject empty client name", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-005",
        clientName: "",
        auditType: "ICV",
      }),
    ).rejects.toThrow("Client name cannot be empty");
  });

  void it("should reject empty audit type", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-007",
        clientName: "Test Client",
        auditType: "",
      }),
    ).rejects.toThrow("Audit type cannot be empty");
  });

  void it("should reject due date in the past", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-008",
        clientName: "Test Client",
        auditType: "ICV",
        dueDate: yesterday.toISOString(),
      }),
    ).rejects.toThrow("Due date cannot be in the past");
  });

  void it("should reject duplicate case number", async () => {
    await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-009",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-009",
        clientName: "Another Client",
        auditType: "ISO 9001",
      }),
    ).rejects.toThrow("A case with this case number already exists");
  });

  void it("should allow same case number in different organizations", async () => {
    const testOrg2 = await createTestOrganization(drizzle);

    await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-010",
      clientName: "Test Client Org 1",
      auditType: "ICV",
    });

    const result = await createCase(drizzle, testOrg2.id, testUser.id, {
      caseNumber: "CASE-010",
      clientName: "Test Client Org 2",
      auditType: "ICV",
    });

    expect(result.caseNumber).toBe("CASE-010");
    expect(result.organizationId).toBe(testOrg2.id);
  });
});
