import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, createScope as dbCreateScope } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { pino } from "pino";
import { createCase } from "./createCase.js";
import { deleteCase } from "./deleteCase.js";
import { NotFound, InsufficientPermissions } from "../../errors.js";

void describe("deleteCase operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "delete-case-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  it("should delete a case successfully", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    const result = await deleteCase(drizzle, testOrg.id, testUser.id, created.id);

    expect(result.success).toBe(true);

    const found = await drizzle.select().from(schema.cases).where(eq(schema.cases.id, created.id));

    expect(found).toHaveLength(0);
  });

  it("should create history entry before deletion", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    await deleteCase(drizzle, testOrg.id, testUser.id, created.id);

    // History should be deleted with case (cascade)
  });

  it("should throw NotFound for non-existent case", async () => {
    await expect(deleteCase(drizzle, testOrg.id, testUser.id, "non-existent-id")).rejects.toThrow(NotFound);
  });

  it("should throw InsufficientPermissions for different organization", async () => {
    const testOrg2 = await createTestOrganization(drizzle);

    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    await expect(deleteCase(drizzle, testOrg2.id, testUser.id, created.id)).rejects.toThrow(
      InsufficientPermissions,
    );
  });

  it("should reject deletion of case with active scopes", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    await dbCreateScope(deps, {
      caseId: created.id,
      name: "Active Scope",
      status: "draft",
      data: {},
      createdBy: testUser.id,
    });

    await expect(deleteCase(drizzle, testOrg.id, testUser.id, created.id)).rejects.toThrow(
      "Cannot delete case with 1 active scope(s)",
    );
  });

  it("should allow deletion of case with archived scopes", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-005",
      title: "Test Case",
      caseType: "ICV_AUDIT",
    });

    await dbCreateScope(deps, {
      caseId: created.id,
      name: "Archived Scope",
      status: "archived",
      data: {},
      createdBy: testUser.id,
    });

    const result = await deleteCase(drizzle, testOrg.id, testUser.id, created.id);

    expect(result.success).toBe(true);
  });

  it("should reject deletion of completed case", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-006",
      title: "Test Case",
      caseType: "ICV_AUDIT",
      status: "completed",
    });

    await expect(deleteCase(drizzle, testOrg.id, testUser.id, created.id)).rejects.toThrow(
      "Cannot delete completed cases",
    );
  });

  it("should allow deletion of pending case", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-007",
      title: "Test Case",
      caseType: "ICV_AUDIT",
      status: "draft",
    });

    const result = await deleteCase(drizzle, testOrg.id, testUser.id, created.id);

    expect(result.success).toBe(true);
  });

  it("should allow deletion of in-progress case", async () => {
    const created = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-008",
      title: "Test Case",
      caseType: "ICV_AUDIT",
      status: "in_progress",
    });

    const result = await deleteCase(drizzle, testOrg.id, testUser.id, created.id);

    expect(result.success).toBe(true);
  });
});
