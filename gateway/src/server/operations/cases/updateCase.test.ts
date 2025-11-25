import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, and } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  nukeDatabase,
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
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void it("should update a case successfully", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      clientName: "Original Client",
      auditType: "ICV",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      clientName: "Updated Client",
      status: "in-progress",
      priority: "high",
    });

    expect(result.clientName).toBe("Updated Client");
    expect(result.status).toBe("in-progress");
    expect(result.priority).toBe("high");
    expect(result.caseNumber).toBe("CASE-001"); // unchanged
  });

  void it("should create history entry with changes", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      status: "in-progress",
      priority: "high",
    });

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(and(eq(schema.caseHistory.caseId, created.id), eq(schema.caseHistory.action, "updated")));

    expect(history).toHaveLength(1);
    expect(history[0].changesBefore).toMatchObject({
      status: "pending",
      priority: "medium",
    });
    expect(history[0].changesAfter).toMatchObject({
      status: "in-progress",
      priority: "high",
    });
  });

  void it("should auto-set completed date when marking as completed", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      status: "completed",
    });

    expect(result.status).toBe("completed");
    expect(result.completedDate).toBeDefined();
  });

  void it("should throw NotFound for non-existent case", async () => {
    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, "non-existent-id", {
        clientName: "Test",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InsufficientPermissions for different organization", async () => {
    const testOrg2 = await createTestOrganization(drizzle);

    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      updateCase(drizzle, testOrg2.id, testUser.id, created.id, {
        clientName: "Hacked",
      }),
    ).rejects.toThrow(InsufficientPermissions);
  });

  void it("should reject invalid case number format", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-005",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        caseNumber: "case-005", // lowercase
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should reject empty client name", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-006",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        clientName: "",
      }),
    ).rejects.toThrow("Client name cannot be empty");
  });

  void it("should reject completed date without completed status", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-007",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        status: "in-progress",
        completedDate: new Date().toISOString(),
      }),
    ).rejects.toThrow("Completed date can only be set when status is 'completed'");
  });

  void it("should reject due date in the past", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-008",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await expect(
      updateCase(drizzle, testOrg.id, testUser.id, created.id, {
        dueDate: yesterday.toISOString(),
      }),
    ).rejects.toThrow("Due date cannot be in the past");
  });

  void it("should not create history if no changes", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-009",
      clientName: "Test Client",
      auditType: "ICV",
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

  void it("should trim whitespace from updated fields", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-010",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const result = await updateCase(drizzle, testOrg.id, testUser.id, created.id, {
      clientName: "  Updated Client  ",
      auditType: "ISO_9001",
    });

    expect(result.clientName).toBe("Updated Client");
    expect(result.auditType).toBe("ISO_9001");
  });
});
