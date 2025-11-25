import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, type RedisClient, schema, eq } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  createTestApprovalWorkflow,
  addMemberToOrganization,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { submitForApproval } from "./submitForApproval.js";
import { approve } from "./approve.js";
import { InvalidInput, NotFound } from "../../errors.js";
import { initTestServerContext } from "../../test-helpers/testServerContext.js";
import { getServerContext, type ServerContext } from "../../serverContext.js";

void describe("approve operation", async () => {
  let drizzle: DrizzleClient;
  let redis: RedisClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let approverUser: TestUser;
  let ctx: ServerContext;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "approve-test" }));
    redis = await initTestServerContext(drizzle);
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, { email: "requester@test.com", name: "Requester" });
    approverUser = await createTestUser(drizzle, {
      email: "approver@test.com",
      name: "Approver",
    });

    await addMemberToOrganization(drizzle, testUser.id, testOrg.id, "member");
    await addMemberToOrganization(drizzle, approverUser.id, testOrg.id, "member");

    ctx = getServerContext();
  });

  afterAll(async () => {
    await redis.quit();
    await close();
  });

  void it("should approve a pending approval request successfully", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    const result = await approve(ctx, testOrg.id, approverUser.id, submitResult.requestId, {
      comments: "Looks good!",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("approved");
    expect(result.requestStatus).toBe("approved");

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.status).toBe("approved");
    expect(approvalStep?.comments).toBe("Looks good!");
    expect(approvalStep?.actionAt).toBeDefined();

    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: (requests, { eq }) => eq(requests.id, submitResult.requestId),
    });

    expect(approvalRequest?.status).toBe("approved");
    expect(approvalRequest?.completedAt).toBeDefined();
  });

  void it("should throw NotFound when approval request does not exist", async () => {
    const nonExistentRequestId = crypto.randomUUID();

    await expect(
      approve(ctx, testOrg.id, approverUser.id, nonExistentRequestId, {
        comments: "Test",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InvalidInput when trying to approve non-pending request", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    await approve(ctx, testOrg.id, approverUser.id, submitResult.requestId, {
      comments: "First approval",
    });

    await expect(
      approve(ctx, testOrg.id, approverUser.id, submitResult.requestId, {
        comments: "Second approval",
      }),
    ).rejects.toThrow(InvalidInput);
  });

  void it("should throw NotFound when user has no pending approval step", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    const otherUser = await createTestUser(drizzle, { email: "other@test.com", name: "Other" });
    await addMemberToOrganization(drizzle, otherUser.id, testOrg.id, "member");

    await expect(
      approve(ctx, testOrg.id, otherUser.id, submitResult.requestId, {
        comments: "Trying to approve",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should handle approval with no comments", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    const result = await approve(ctx, testOrg.id, approverUser.id, submitResult.requestId, {});

    expect(result.success).toBe(true);
    expect(result.requestStatus).toBe("approved");

    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.comments).toBeNull();
  });

  void it("should allow delegated user to approve", async () => {
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(ctx, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    const delegateUser = await createTestUser(drizzle, {
      email: "delegate@test.com",
      name: "Delegate",
    });
    await addMemberToOrganization(drizzle, delegateUser.id, testOrg.id, "member");

    await drizzle
      .update(schema.approvalSteps)
      .set({ delegatedTo: delegateUser.id })
      .where(eq(schema.approvalSteps.requestId, submitResult.requestId));

    const result = await approve(ctx, testOrg.id, delegateUser.id, submitResult.requestId, {
      comments: "Approved by delegate",
    });

    expect(result.success).toBe(true);
    expect(result.requestStatus).toBe("approved");
  });
});
