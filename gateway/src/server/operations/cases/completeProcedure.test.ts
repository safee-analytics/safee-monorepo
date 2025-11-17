import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  type DrizzleClient,
  schema,
  eq,
  and,
  createScope as dbCreateScope,
  createSection as dbCreateSection,
  createProcedure as dbCreateProcedure,
} from "@safee/database";
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
import { completeProcedure } from "./completeProcedure.js";
import { NotFound } from "../../errors.js";

void describe("completeProcedure operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "complete-procedure-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
  });

  afterAll(async () => {
    await close();
  });

  void it("should complete a procedure successfully", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const procedure = await dbCreateProcedure(deps, {
      sectionId: section.id,
      referenceNumber: "1.1",
      title: "Test Procedure",
      sortOrder: 1,
    });

    const result = await completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
      fieldData: { field1: "value1" },
      memo: "Test memo",
    });

    expect(result.isCompleted).toBe(true);
    expect(result.completedBy).toBe(testUser.id);
    expect(result.completedAt).toBeDefined();
    expect(result.fieldData).toEqual({ field1: "value1" });
    expect(result.memo).toBe("Test memo");
  });

  void it("should create history entry", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const procedure = await dbCreateProcedure(deps, {
      sectionId: section.id,
      referenceNumber: "1.1",
      title: "Test Procedure",
      sortOrder: 1,
    });

    await completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
      memo: "Test",
    });

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(and(eq(schema.caseHistory.caseId, testCase.id), eq(schema.caseHistory.entityType, "procedure")));

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("completed");
  });

  void it("should throw NotFound for non-existent procedure", async () => {
    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      completeProcedure(drizzle, testUser.id, testCase.id, "non-existent-id", {
        memo: "Test",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InvalidInput if already completed", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const procedure = await dbCreateProcedure(deps, {
      sectionId: section.id,
      referenceNumber: "1.1",
      title: "Test Procedure",
      sortOrder: 1,
    });

    await completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
      memo: "First completion",
    });
    await expect(
      completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
        memo: "Second completion",
      }),
    ).rejects.toThrow("Procedure is already completed");
  });

  void it("should throw InvalidInput if not editable", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-005",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const [procedure] = await drizzle
      .insert(schema.auditProcedures)
      .values({
        sectionId: section.id,
        referenceNumber: "1.1",
        title: "Non-editable Procedure",
        sortOrder: 1,
        canEdit: false,
      })
      .returning();

    await expect(
      completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
        memo: "Test",
      }),
    ).rejects.toThrow("This procedure cannot be edited");
  });

  void it("should reject if field data required but not provided", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-006",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const [procedure] = await drizzle
      .insert(schema.auditProcedures)
      .values({
        sectionId: section.id,
        referenceNumber: "1.1",
        title: "Required Procedure",
        sortOrder: 1,
        requirements: { isRequired: true },
      })
      .returning();

    await expect(
      completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
        memo: "Test",
      }),
    ).rejects.toThrow("Field data is required for this procedure");
  });

  void it("should reject if observations required but not provided", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-007",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const [procedure] = await drizzle
      .insert(schema.auditProcedures)
      .values({
        sectionId: section.id,
        referenceNumber: "1.1",
        title: "Observation Required Procedure",
        sortOrder: 1,
        requirements: { requiresObservations: true },
      })
      .returning();

    await expect(
      completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {
        fieldData: { test: "data" },
      }),
    ).rejects.toThrow("Observations/memo is required for this procedure");
  });

  void it("should complete without field data if not required", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-008",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const scope = await dbCreateScope(deps, {
      caseId: testCase.id,
      name: "Test Scope",
      status: "draft",
      createdBy: testUser.id,
    });

    const section = await dbCreateSection(deps, {
      scopeId: scope.id,
      name: "Test Section",
      sortOrder: 1,
    });

    const procedure = await dbCreateProcedure(deps, {
      sectionId: section.id,
      referenceNumber: "1.1",
      title: "Optional Procedure",
      sortOrder: 1,
    });

    const result = await completeProcedure(drizzle, testUser.id, testCase.id, procedure.id, {});

    expect(result.isCompleted).toBe(true);
  });
});
