import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient } from "@safee/database";
import {
  connectTest,
  createTestOrganization,
  createTestUser,
  addMemberToOrganization,
  cleanTestData,
} from "@safee/database/test-helpers";
import { pino } from "pino";
import { ResourceAssignmentService } from "./resourceAssignment.service.js";

void describe("ResourceAssignmentService", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let service: ResourceAssignmentService;
  const logger = pino({ level: "silent" });

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "resource-assignment-service-test" }));
  });

  beforeEach(async () => {
    await cleanTestData(drizzle);
    service = new ResourceAssignmentService({ drizzle, logger });
  });

  afterAll(async () => {
    await close();
  });

  void describe("assignResource", () => {
    it("should assign user to resource successfully", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "lead",
        assignedBy: user.id,
      });

      const assignments = await drizzle.query.resourceAssignments.findMany({
        where: (t, { eq, and }) =>
          and(eq(t.userId, user.id), eq(t.resourceType, "audit_case"), eq(t.resourceId, resourceId)),
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0]?.role).toBe("lead");
      expect(assignments[0]?.organizationId).toBe(org.id);
    });

    it("should prevent duplicate assignments", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "lead",
        assignedBy: user.id,
      });

      await expect(
        service.assignResource({
          userId: user.id,
          organizationId: org.id,
          resourceType: "audit_case",
          resourceId,
          role: "reviewer",
          assignedBy: user.id,
        }),
      ).rejects.toThrow();
    });

    it("should assign multiple users to same resource", async () => {
      const org = await createTestOrganization(drizzle);
      const user1 = await createTestUser(drizzle, { email: "user1@test.com" });
      const user2 = await createTestUser(drizzle, { email: "user2@test.com" });
      await addMemberToOrganization(drizzle, user1.id, org.id, "member");
      await addMemberToOrganization(drizzle, user2.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user1.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "lead",
        assignedBy: user1.id,
      });

      await service.assignResource({
        userId: user2.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "team_member",
        assignedBy: user1.id,
      });

      const assignments = await drizzle.query.resourceAssignments.findMany({
        where: (t, { eq, and }) => and(eq(t.resourceType, "audit_case"), eq(t.resourceId, resourceId)),
      });

      expect(assignments).toHaveLength(2);
    });
  });

  void describe("getAssignedResources", () => {
    it("should return empty array for owner/admin", async () => {
      const org = await createTestOrganization(drizzle);
      const owner = await createTestUser(drizzle, { email: "owner@test.com" });
      await addMemberToOrganization(drizzle, owner.id, org.id, "owner");

      const resourceIds = await service.getAssignedResources(owner.id, org.id, "audit_case");

      expect(resourceIds).toEqual([]);
    });

    it("should return assigned resource IDs for regular member", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId1 = crypto.randomUUID();
      const resourceId2 = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId: resourceId1,
        assignedBy: user.id,
      });

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId: resourceId2,
        assignedBy: user.id,
      });

      const resourceIds = await service.getAssignedResources(user.id, org.id, "audit_case");

      expect(resourceIds).toHaveLength(2);
      expect(resourceIds).toContain(resourceId1);
      expect(resourceIds).toContain(resourceId2);
    });

    it("should filter by resource type", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const auditCaseId = crypto.randomUUID();
      const clientId = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId: auditCaseId,
        assignedBy: user.id,
      });

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "accounting_client",
        resourceId: clientId,
        assignedBy: user.id,
      });

      const auditCases = await service.getAssignedResources(user.id, org.id, "audit_case");
      const clients = await service.getAssignedResources(user.id, org.id, "accounting_client");

      expect(auditCases).toEqual([auditCaseId]);
      expect(clients).toEqual([clientId]);
    });

    it("should return empty array for member with no assignments", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceIds = await service.getAssignedResources(user.id, org.id, "audit_case");

      expect(resourceIds).toEqual([]);
    });
  });

  void describe("hasResourceAccess", () => {
    it("should grant access to owner/admin for any resource", async () => {
      const org = await createTestOrganization(drizzle);
      const owner = await createTestUser(drizzle, { email: "owner@test.com" });
      await addMemberToOrganization(drizzle, owner.id, org.id, "owner");

      const resourceId = crypto.randomUUID();

      const hasAccess = await service.hasResourceAccess(owner.id, org.id, "audit_case", resourceId);

      expect(hasAccess).toBe(true);
    });

    it("should grant access to assigned resources", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        assignedBy: user.id,
      });

      const hasAccess = await service.hasResourceAccess(user.id, org.id, "audit_case", resourceId);

      expect(hasAccess).toBe(true);
    });

    it("should deny access to unassigned resources", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      const hasAccess = await service.hasResourceAccess(user.id, org.id, "audit_case", resourceId);

      expect(hasAccess).toBe(false);
    });
  });

  void describe("unassignResource", () => {
    it("should remove assignment successfully", async () => {
      const org = await createTestOrganization(drizzle);
      const user = await createTestUser(drizzle);
      await addMemberToOrganization(drizzle, user.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        assignedBy: user.id,
      });

      await service.unassignResource(user.id, "audit_case", resourceId);

      const hasAccess = await service.hasResourceAccess(user.id, org.id, "audit_case", resourceId);

      expect(hasAccess).toBe(false);
    });

    it("should not throw error when removing non-existent assignment", async () => {
      const user = await createTestUser(drizzle);
      const resourceId = crypto.randomUUID();

      await expect(service.unassignResource(user.id, "audit_case", resourceId)).resolves.not.toThrow();
    });
  });

  void describe("getResourceAssignments", () => {
    it("should return all assignments for a resource", async () => {
      const org = await createTestOrganization(drizzle);
      const user1 = await createTestUser(drizzle, { email: "user1@test.com" });
      const user2 = await createTestUser(drizzle, { email: "user2@test.com" });
      await addMemberToOrganization(drizzle, user1.id, org.id, "member");
      await addMemberToOrganization(drizzle, user2.id, org.id, "member");

      const resourceId = crypto.randomUUID();

      await service.assignResource({
        userId: user1.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "lead",
        assignedBy: user1.id,
      });

      await service.assignResource({
        userId: user2.id,
        organizationId: org.id,
        resourceType: "audit_case",
        resourceId,
        role: "reviewer",
        assignedBy: user1.id,
      });

      const assignments = await service.getResourceAssignments(org.id, "audit_case", resourceId);

      expect(assignments).toHaveLength(2);
      expect(assignments.some((a) => a.userId === user1.id && a.role === "lead")).toBe(true);
      expect(assignments.some((a) => a.userId === user2.id && a.role === "reviewer")).toBe(true);
    });

    it("should return empty array for resource with no assignments", async () => {
      const org = await createTestOrganization(drizzle);
      const resourceId = crypto.randomUUID();

      const assignments = await service.getResourceAssignments(org.id, "audit_case", resourceId);

      expect(assignments).toEqual([]);
    });
  });
});
