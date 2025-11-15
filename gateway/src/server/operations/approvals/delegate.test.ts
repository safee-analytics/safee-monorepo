import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
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
import { delegate } from "./delegate.js";
import { NotFound } from "../../errors.js";

void describe("delegate operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let approverUser: TestUser;
  let delegateUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "delegate-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    // Create test data
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, testOrg.id, { email: "requester@test.com", name: "Requester" });
    approverUser = await createTestUser(drizzle, testOrg.id, {
      email: "approver@test.com",
      name: "Approver",
    });
    delegateUser = await createTestUser(drizzle, testOrg.id, {
      email: "delegate@test.com",
      name: "Delegate",
    });
  });

  afterAll(async () => {
    await close();
  });

  void it("should delegate a pending approval successfully", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Test: Delegate the approval
    const result = await delegate(drizzle, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
      comments: "Please review this for me",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("delegated successfully");

    // Verify approval step was updated
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(delegateUser.id);
    expect(approvalStep?.comments).toBe("Please review this for me");
    expect(approvalStep?.status).toBe("pending"); // Status should still be pending
  });

  void it("should delegate without comments", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Test: Delegate without comments
    const result = await delegate(drizzle, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
    });

    expect(result.success).toBe(true);

    // Verify delegation was set
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(delegateUser.id);
    expect(approvalStep?.comments).toBeNull();
  });

  void it("should throw NotFound when approval request does not exist", async () => {
    const nonExistentRequestId = crypto.randomUUID();

    await expect(
      delegate(drizzle, approverUser.id, nonExistentRequestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw NotFound when user has no pending approval step", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Test: Try to delegate as a different user (not the approver)
    const otherUser = await createTestUser(drizzle, testOrg.id, { email: "other@test.com", name: "Other" });

    await expect(
      delegate(drizzle, otherUser.id, submitResult.requestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw NotFound when trying to delegate already actioned step", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Manually set the step as approved
    await drizzle
      .update(schema.approvalSteps)
      .set({
        status: "approved",
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.requestId, submitResult.requestId));

    // Test: Try to delegate an already approved step
    await expect(
      delegate(drizzle, approverUser.id, submitResult.requestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should allow re-delegation to another user", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // First delegation
    await delegate(drizzle, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
      comments: "First delegation",
    });

    // Create another user for re-delegation
    const secondDelegateUser = await createTestUser(drizzle, testOrg.id, {
      email: "delegate2@test.com",
      name: "Delegate 2",
    });

    // Test: Re-delegate to another user
    const result = await delegate(drizzle, approverUser.id, submitResult.requestId, {
      delegateToUserId: secondDelegateUser.id,
      comments: "Re-delegating to someone else",
    });

    expect(result.success).toBe(true);

    // Verify the new delegation
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(secondDelegateUser.id);
    expect(approvalStep?.comments).toBe("Re-delegating to someone else");
  });
});
