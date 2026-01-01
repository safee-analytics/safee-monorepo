import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, and } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  cleanTestData,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { createCase } from "./createCase.js";
import { updateCase } from "./updateCase.js";
import { InvalidInput, NotFound, InsufficientPermissions } from "../../errors.js";

void describe("updateCase operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "update-case-test" }));
  });

  beforeEach(async () => {
    await cleanTestData(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  it("should update a case successfully", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      title: "Original Title",
      caseType: "ICV_AUDIT",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      title: "Updated Title",
      status: "in_progress",
      priority: "high",
    });

    expect(result.title).toBe("Updated Title");
    expect(result.status).toBe("in_progress");
    expect(result.priority).toBe("high");
    expect(result.caseNumber).toBe("CASE-001"); // unchanged
  });

  it("should create history entry with changes", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      status: "in_progress",
      priority: "high",
    });

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(and(eq(schema.caseHistory.caseId, created.id), eq(schema.caseHistory.action, "updated")));

    expect(history).toHaveLength(1);
    expect(history[0].changesBefore).toMatchObject({
      status: "draft",
      priority: "medium",
    });
    expect(history[0].changesAfter).toMatchObject({
      status: "in_progress",
      priority: "high",
    });
  });

  it("should auto-set completed date when marking as completed", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      status: "completed",
    });

    expect(result.status).toBe("completed");
    expect(result.completedDate).toBeDefined();
  });

  it("should throw NotFound for non-existent case", async () => {
    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, "non-existent-id", {
        title: "Test",
      }),
    ).rejects.toThrow(NotFound);
  });

  it("should throw InsufficientPermissions for different organization", async () => {
    const testOrg2 = await createTestOrganization(drizzle);

    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    await expect(
      updateCase(drizzle, testOrg2.id, testUser.id, created.id, {
        title: "Hacked",
      }),
    ).rejects.toThrow(InsufficientPermissions);
  });

  it("should reject invalid case number format", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-005",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        caseNumber: "case-005", // lowercase
      }),
    ).rejects.toThrow(InvalidInput);
  });

  it("should reject empty title", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-006",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        title: "",
      }),
    ).rejects.toThrow("Title cannot be empty");
  });

  it("should reject completed date without completed status", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-007",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        status: "in_progress",
        completedDate: new Date().toISOString(),
      }),
    ).rejects.toThrow("Completed date can only be set when status is 'completed'");
  });

  it("should reject due date in the past", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-008",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        dueDate: yesterday.toISOString(),
      }),
    ).rejects.toThrow("Due date cannot be in the past");
  });

  it("should not create history if no changes", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-009",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    // Clear creation history
    await drizzle.delete(schema.caseHistory);

    await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      // No actual changes
    });

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(eq(schema.caseHistory.caseId, created.id));

    expect(history).toHaveLength(0);
  });

  it("should trim whitespace from updated fields", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-010",
      title: "Test Title",
      caseType: "ICV_AUDIT",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      title: "  Updated Title  ",
      caseType: "ISO_9001_AUDIT",
    });

    expect(result.title).toBe("Updated Title");
    expect(result.caseType).toBe("ISO_9001_AUDIT");
  });
});
