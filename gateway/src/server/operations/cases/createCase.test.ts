import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  cleanTestData,
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
    await cleanTestData(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  it("should create a case successfully", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    expect(result.id).toBeDefined();
    expect(result.caseNumber).toBe("CASE-001");
    expect(result.title).toBe("Test Case");
    expect(result.caseType).toBe("ICV_AUDIT");
    expect(result.status).toBe("draft");
    expect(result.priority).toBe("medium");
    expect(result.organizationId).toBe(testOrg.id);
    expect(result.createdBy).toBe(testUser.id);
  });

  it("should create a case with all optional fields", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      title: "Test Case 2",
      caseType: "ISO_9001_AUDIT",
      status: "in_progress",
      priority: "high",
      dueDate: tomorrow.toISOString(),
    });

    expect(result.status).toBe("in_progress");
    expect(result.priority).toBe("high");
    expect(result.dueDate).toBeDefined();
  });

  it("should create history entry on case creation", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      title: "Test Case 3",
      caseType: "ICV_AUDIT",
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
      title: "Test Case 3",
      caseType: "ICV_AUDIT",
    });
  });

  it("should trim whitespace from title", async () => {
    const result = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      title: "  Test Case  ",
      caseType: "ICV_AUDIT",
    });

    expect(result.title).toBe("Test Case");
    expect(result.caseType).toBe("ICV_AUDIT");
  });

  it("should reject invalid case number format", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "case-001", // lowercase
        title: "Test Case",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow(InvalidInput);

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE 001", // space
        title: "Test Case",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow(InvalidInput);
  });

  it("should reject case number that is too short", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "C1",
        title: "Test Case",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow("Case number must be between 3 and 50 characters");
  });

  it("should reject case number that is too long", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "C".repeat(51),
        title: "Test Case",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow("Case number must be between 3 and 50 characters");
  });

  it("should reject empty title", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-005",
        title: "",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow("Title cannot be empty");
  });

  it("should reject empty title with whitespace", async () => {
    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-007",
        title: "   ",
        caseType: "ICV_AUDIT",
      }),
    ).rejects.toThrow("Title cannot be empty");
  });

  it("should reject due date in the past", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-008",
        title: "Test Case",
        caseType: "ICV_AUDIT",
        dueDate: yesterday.toISOString(),
      }),
    ).rejects.toThrow("Due date cannot be in the past");
  });

  it("should reject duplicate case number", async () => {
    await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-009",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    await expect(
      createCase(drizzle, testOrg.id, testUser.id, {
        caseNumber: "CASE-009",
        title: "Another Case",
        caseType: "ISO_9001_AUDIT",
      }),
    ).rejects.toThrow("A case with this case number already exists");
  });

  it("should allow same case number in different organizations", async () => {
    const testOrg2 = await createTestOrganization(drizzle);

    await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-010",
      title: "Org1 Case",
      caseType: "ICV_AUDIT",
    });

    const result = await createCase(drizzle, testOrg2.id, testUser.id, {
      caseNumber: "CASE-010",
      title: "Org2 Case",
      caseType: "ICV_AUDIT",
    });

    expect(result.caseNumber).toBe("CASE-010");
    expect(result.organizationId).toBe(testOrg2.id);
  });
});
