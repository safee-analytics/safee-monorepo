import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq } from "@safee/database";
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
import { reject } from "./reject.js";
import { InvalidInput, NotFound } from "../../errors.js";

void describe("reject operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let approverUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "reject-test" }));
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

    // Add users as members of the organization
    await addMemberToOrganization(drizzle, testUser.id, testOrg.id, "member");
    await addMemberToOrganization(drizzle, approverUser.id, testOrg.id, "member");
  });

  afterAll(async () => {
    await close();
  });

  void it("should reject a pending approval request successfully", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Test: Reject the request
    const result = await reject(drizzle, testOrg.id, approverUser.id, submitResult.requestId, {
      comments: "Not approved - missing documentation",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("rejected");
    expect(result.requestStatus).toBe("rejected");

    // Verify approval step was updated
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.status).toBe("rejected");
    expect(approvalStep?.comments).toBe("Not approved - missing documentation");
    expect(approvalStep?.actionAt).toBeDefined();

    // Verify approval request was updated
    const approvalRequest = await drizzle.query.approvalRequests.findFirst({
      where: (requests, { eq }) => eq(requests.id, submitResult.requestId),
    });

    expect(approvalRequest?.status).toBe("rejected");
    expect(approvalRequest?.completedAt).toBeDefined();
  });

  void it("should throw NotFound when approval request does not exist", async () => {
    const nonExistentRequestId = crypto.randomUUID();

    await expect(
      reject(drizzle, testOrg.id, approverUser.id, nonExistentRequestId, {
        comments: "Test",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InvalidInput when trying to reject non-pending request", async () => {
    // Setup: Create workflow, submit, and reject
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Reject once
    await reject(drizzle, testOrg.id, approverUser.id, submitResult.requestId, {
      comments: "First rejection",
    });

    // Try to reject again
    await expect(
      reject(drizzle, testOrg.id, approverUser.id, submitResult.requestId, {
        comments: "Second rejection",
      }),
    ).rejects.toThrow(InvalidInput);
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

    // Test: Try to reject with a different user
    const otherUser = await createTestUser(drizzle, testOrg.id, { email: "other@test.com", name: "Other" });
    await addMemberToOrganization(drizzle, otherUser.id, testOrg.id, "member");

    await expect(
      reject(drizzle, testOrg.id, otherUser.id, submitResult.requestId, {
        comments: "Trying to reject",
      }),
    ).rejects.toThrow(NotFound);
  });

  void it("should handle rejection with no comments", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Test: Reject without comments
    const result = await reject(drizzle, testOrg.id, approverUser.id, submitResult.requestId, {});

    expect(result.success).toBe(true);
    expect(result.requestStatus).toBe("rejected");

    // Verify no comments were saved
    const approvalStep = await drizzle.query.approvalSteps.findFirst({
      where: (steps, { eq, and }) =>
        and(eq(steps.requestId, submitResult.requestId), eq(steps.approverId, approverUser.id)),
    });

    expect(approvalStep?.comments).toBeNull();
  });

  void it("should allow delegated user to reject", async () => {
    // Setup: Create workflow and submit for approval
    await createTestApprovalWorkflow(drizzle, testOrg.id, approverUser.id);
    const entityId = crypto.randomUUID();

    const submitResult = await submitForApproval(drizzle, testOrg.id, testUser.id, {
      entityType: "invoice",
      entityId: entityId,
      entityData: { entityType: "invoice", entityId: entityId, amount: 1000, currency: "USD" },
    });

    // Delegate to another user
    const delegateUser = await createTestUser(drizzle, testOrg.id, {
      email: "delegate@test.com",
      name: "Delegate",
    });
    await addMemberToOrganization(drizzle, delegateUser.id, testOrg.id, "member");

    await drizzle
      .update(schema.approvalSteps)
      .set({ delegatedTo: delegateUser.id })
      .where(eq(schema.approvalSteps.requestId, submitResult.requestId));

    // Test: Reject as delegated user
    const result = await reject(drizzle, testOrg.id, delegateUser.id, submitResult.requestId, {
      comments: "Rejected by delegate",
    });

    expect(result.success).toBe(true);
    expect(result.requestStatus).toBe("rejected");
  });
});
