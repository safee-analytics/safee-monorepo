import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  createTestApprovalWorkflow,
  cleanTestData,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { submitForApproval } from "./submitForApproval.js";
import { delegate } from "./delegate.js";
import { NotFound } from "../../errors.js";
import { initTestServerContext } from "../../test-helpers/testServerContext.js";
import { getServerContext, type ServerContext } from "../../serverContext.js";

void describe("delegate operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let approverUser: TestUser;
  let delegateUser: TestUser;
  let ctx: ServerContext;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "delegate-test" }));
    await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await cleanTestData(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, { email: "requester@test.com", name: "Requester" });
    approverUser = await createTestUser(drizzle, {
      email: "approver@test.com",
      name: "Approver",
    });
    delegateUser = await createTestUser(drizzle, {
      email: "delegate@test.com",
      name: "Delegate",
    });

    ctx = getServerContext();
  });

  afterAll(async () => {
    await close();
  });

  it("should delegate a pending approval successfully", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId,
      entityData: { entityType: "invoice", entityId, amount: 1000, currency: "USD" },
    });

    const result = await delegate(ctx, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
      comments: "Please review this for me",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("delegated successfully");

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(delegateUser.id);
    expect(approvalStep?.comments).toBe("Please review this for me");
    expect(approvalStep?.status).toBe("pending");
  });

  it("should delegate without comments", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId,
      entityData: { entityType: "invoice", entityId, amount: 1000, currency: "USD" },
    });

    const result = await delegate(ctx, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
    });

    expect(result.success).toBe(true);

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(delegateUser.id);
    expect(approvalStep?.comments).toBeNull();
  });

  it("should throw NotFound when approval request does not exist", async () => {
    const nonExistentRequestId = crypto.randomUUID();

    await expect(
      delegate(ctx, approverUser.id, nonExistentRequestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  it("should throw NotFound when user has no pending approval step", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId,
      entityData: { entityType: "invoice", entityId, amount: 1000, currency: "USD" },
    });

    const otherUser = await createTestUser(drizzle, { email: "other@test.com", name: "Other" });

    await expect(
      delegate(ctx, otherUser.id, submitResult.requestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  it("should throw NotFound when trying to delegate already actioned step", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId,
      entityData: { entityType: "invoice", entityId, amount: 1000, currency: "USD" },
    });

    await drizzle
      .update(schema.approvalSteps)
      .set({
        status: "approved",
        actionAt: new Date(),
      })
      .where(eq(schema.approvalSteps.requestId, submitResult.requestId));

    await expect(
      delegate(ctx, approverUser.id, submitResult.requestId, {
        delegateToUserId: delegateUser.id,
      }),
    ).rejects.toThrow(NotFound);
  });

  it("should allow re-delegation to another user", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId,
      entityData: { entityType: "invoice", entityId, amount: 1000, currency: "USD" },
    });

    await delegate(ctx, approverUser.id, submitResult.requestId, {
      delegateToUserId: delegateUser.id,
      comments: "First delegation",
    });

    const secondDelegateUser = await createTestUser(drizzle, {
      email: "delegate2@test.com",
      name: "Delegate 2",
    });

    const result = await delegate(ctx, approverUser.id, submitResult.requestId, {
      delegateToUserId: secondDelegateUser.id,
      comments: "Re-delegating to someone else",
    });

    expect(result.success).toBe(true);

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.delegatedTo).toBe(secondDelegateUser.id);
    expect(approvalStep?.comments).toBe("Re-delegating to someone else");
  });
});
