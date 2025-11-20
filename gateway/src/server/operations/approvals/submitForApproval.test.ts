import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  createTestApprovalWorkflow,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { submitForApproval } from "./submitForApproval.js";
import { InvalidInput, NotFound } from "../../errors.js";

void describe("submitForApproval operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let approverUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "submit-approval-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, { email: "requester@test.com", name: "Requester" });
    approverUser = await createTestUser(drizzle, {
      email: "approver@test.com",
      name: "Approver",
    });
  });

  afterAll(async () => {
    await close();
  });

  void it("should submit an entity for approval successfully", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);

    const entityId = crypto.randomUUID();

    const result = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    expect(result.requestId).toBeDefined();
    expect(result.workflowId).toBeDefined();
    expect(result.status).toBe("pending");
    expect(result.message).toContain("submitted for approval");
    expect(result.message).toContain("1 approver(s)");

    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: (requests, { eq }) => eq(requests.id, result.requestId),
    });

    expect(approvalRequest).toBeDefined();
    expect(approvalRequest?.status).toBe("pending");
    expect(approvalRequest?.entityType).toBe("invoice");
    expect(approvalRequest?.entityId).toBe(entityId);
    expect(approvalRequest?.requestedBy).toBe(testUser.id);

    const approvalSteps = await drizzle.query.approvalSteps.findMany({
      where: (steps, { eq }) => eq(steps.requestId, result.requestId),
    });

    expect(approvalSteps).toHaveLength(1);
    expect(approvalSteps[0]?.approverId).toBe(approverUser.id);
    expect(approvalSteps[0]?.status).toBe("pending");
    expect(approvalSteps[0]?.stepOrder).toBe(1);
  });

  void it("should throw InvalidInput when entity type is empty", async () => {
    const entityId = crypto.randomUUID();
    await expect(
      submitForApproval(drizzle, testOrg.id, testUser.id, {
        entityType: "",
        entityId: entityId,
        // @ts-expect-error - Testing invalid empty entity type
        entityData: { entityType: "", entityId: entityId, amount: 1000 },
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should throw InvalidInput when entity ID is empty", async () => {
    await expect(
      submitForApproval(drizzle, testOrg.id, testUser.id, {
        entityType: "invoice",
        entityId: "",
        entityData: { entityType: "invoice", entityId: "", amount: 1000 },
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should throw NotFound when no workflow matches entity data", async () => {
    const entityId = crypto.randomUUID();
    await expect(
      submitForApproval(drizzle, testOrg.id, testUser.id, {
        entityType: "invoice",
        entityId: entityId,
        entityData: { entityType: "invoice", entityId: entityId },
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw NotFound when no matching workflow exists", async () => {
    const entityId = crypto.randomUUID();

    await expect(
      submitForApproval(drizzle, testOrg.id, testUser.id, {
        entityType: "invoice",
        entityId: entityId,
        entityData: { entityType: "invoice", entityId: entityId, amount: 1000 },
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InvalidInput when workflow has no steps", async () => {
    const [workflow] = await drizzle
      .insert(schema.approvalWorkflows)
      .values({
        name: "Empty Workflow",
        organizationId: testOrg.id,
        entityType: "invoice" as never,
        isActive: true,
        rules: {},
      })
      .returning();

    await drizzle.insert(schema.approvalRules).values({
      organizationId: testOrg.id,
      entityType: "invoice" as never,
      ruleName: "Test Rule",
      conditions: {
        conditions: [{ type: "manual" }],
        logic: "AND",
      },
      workflowId: workflow.id,
      priority: 1,
    });

    const entityId = crypto.randomUUID();
    await expect(
      submitForApproval(drizzle, testOrg.id, testUser.id, {
        entityType: "invoice",
        entityId: entityId,
        entityData: { entityType: "invoice", entityId: entityId, amount: 1000 },
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should create workflow with parallel approval type", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id, {
      stepType: "parallel",
      minApprovals: 1,
    });

    const entityId = crypto.randomUUID();
    const result = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000 },
    });

    expect(result.requestId).toBeDefined();
    expect(result.workflowId).toBeDefined();
    expect(result.status).toBe("pending");

    const approvalSteps = await drizzle.query.approvalSteps.findMany({
      where: (steps, { eq }) => eq(steps.requestId, result.requestId),
    });

    expect(approvalSteps.length).toBeGreaterThanOrEqual(1);
  });

  void it("should handle workflow for different entity types", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id, { entityType: "employee" });

    const entityId = crypto.randomUUID();
    const result = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "employee",
      entityId: entityId,
      entityData: { entityType: "employee", entityId: entityId, salary: 5000 },
    });

    expect(result.requestId).toBeDefined();
    expect(result.status).toBe("pending");

    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: (requests, { eq }) => eq(requests.id, result.requestId),
    });

    expect(approvalRequest?.entityType).toBe("employee");
    expect(approvalRequest?.entityId).toBe(entityId);
  });
});
