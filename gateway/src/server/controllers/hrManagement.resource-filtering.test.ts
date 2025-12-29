import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema } from "@safee/database";
import { connectTest, createTestOrganization, createTestUser, addMemberToOrganization, cleanTestData } from "@safee/database/test-helpers";
import { initTestServerContext } from "../test-helpers/testServerContext.js";
import type { ServerContext } from "../serverContext.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { HRManagementController } from "./hrManagementController.js";
import { ResourceAssignmentService } from "../services/resourceAssignment.service.js";

void describe("HRManagementController - Resource Filtering", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let context: ServerContext;
  let controller: HRManagementController;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "hr-resource-filtering-test" }));
    context = await initTestServerContext(drizzle);
    controller = new HRManagementController();
  });

  beforeEach(async () => {
    await cleanTestData(drizzle);
  });

  afterAll(async () => {
    await context.redis.quit();
    await close();
  });

  void describe("getDepartments", () => {
    it("should return all departments for owner", async () => {
      const org = await createTestOrganization(drizzle);
      const owner = await createTestUser(drizzle, { email: "owner@test.com" });
      await addMemberToOrganization(drizzle, owner.id, org.id, "owner");

      // Create departments
      await drizzle.insert(schema.hrDepartments).values([
        {
          organizationId: org.id,
          name: "Engineering",
          note: "Engineering department",
        },
        {
          organizationId: org.id,
          name: "Sales",
          note: "Sales department",
        },
      ]);

      const mockRequest = {
        betterAuthSession: {
          user: owner,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      const departments = await controller.getDepartments(mockRequest);

      expect(departments).toHaveLength(2);
    });

    it("should return only assigned departments for regular member", async () => {
      const org = await createTestOrganization(drizzle);
      const member = await createTestUser(drizzle, { email: "member@test.com" });
      await addMemberToOrganization(drizzle, member.id, org.id, "member");

      // Create departments
      const [dept1, _dept2] = await drizzle.insert(schema.hrDepartments).values([
        {
          organizationId: org.id,
          name: "Engineering",
          note: "Engineering department",
        },
        {
          organizationId: org.id,
          name: "Sales",
          note: "Sales department",
        },
      ]).returning();

      // Assign member to only Engineering department
      const assignmentService = new ResourceAssignmentService({ drizzle: context.drizzle, logger: context.logger });
      await assignmentService.assignResource({
        userId: member.id,
        organizationId: org.id,
        resourceType: "hr_department",
        resourceId: dept1.id,
        assignedBy: member.id,
      });

      const mockRequest = {
        betterAuthSession: {
          user: member,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      const departments = await controller.getDepartments(mockRequest);

      expect(departments).toHaveLength(1);
      expect(departments[0]?.id).toBe(dept1.id);
      expect(departments[0]?.name).toBe("Engineering");
    });

    it("should return empty array for member with no assignments", async () => {
      const org = await createTestOrganization(drizzle);
      const member = await createTestUser(drizzle, { email: "member@test.com" });
      await addMemberToOrganization(drizzle, member.id, org.id, "member");

      // Create departments
      await drizzle.insert(schema.hrDepartments).values([
        {
          organizationId: org.id,
          name: "Engineering",
          note: "Engineering department",
        },
      ]);

      const mockRequest = {
        betterAuthSession: {
          user: member,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      const departments = await controller.getDepartments(mockRequest);

      expect(departments).toEqual([]);
    });
  });

  void describe("getDepartment", () => {
    it("should allow owner to access any department", async () => {
      const org = await createTestOrganization(drizzle);
      const owner = await createTestUser(drizzle, { email: "owner@test.com" });
      await addMemberToOrganization(drizzle, owner.id, org.id, "owner");

      const [dept] = await drizzle.insert(schema.hrDepartments).values({
        organizationId: org.id,
        name: "Engineering",
        note: "Engineering department",
      }).returning();

      const mockRequest = {
        betterAuthSession: {
          user: owner,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      const department = await controller.getDepartment(mockRequest, dept.id);

      expect(department.id).toBe(dept.id);
      expect(department.name).toBe("Engineering");
    });

    it("should allow member to access assigned department", async () => {
      const org = await createTestOrganization(drizzle);
      const member = await createTestUser(drizzle, { email: "member@test.com" });
      await addMemberToOrganization(drizzle, member.id, org.id, "member");

      const [dept] = await drizzle.insert(schema.hrDepartments).values({
        organizationId: org.id,
        name: "Engineering",
        note: "Engineering department",
      }).returning();

      // Assign member to department
      const assignmentService = new ResourceAssignmentService({ drizzle: context.drizzle, logger: context.logger });
      await assignmentService.assignResource({
        userId: member.id,
        organizationId: org.id,
        resourceType: "hr_department",
        resourceId: dept.id,
        assignedBy: member.id,
      });

      const mockRequest = {
        betterAuthSession: {
          user: member,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      const department = await controller.getDepartment(mockRequest, dept.id);

      expect(department.id).toBe(dept.id);
      expect(department.name).toBe("Engineering");
    });

    it("should deny member access to unassigned department", async () => {
      const org = await createTestOrganization(drizzle);
      const member = await createTestUser(drizzle, { email: "member@test.com" });
      await addMemberToOrganization(drizzle, member.id, org.id, "member");

      const [dept] = await drizzle.insert(schema.hrDepartments).values({
        organizationId: org.id,
        name: "Engineering",
        note: "Engineering department",
      }).returning();

      const mockRequest = {
        betterAuthSession: {
          user: member,
          session: { activeOrganizationId: org.id },
        },
        drizzle: context.drizzle,
        logger: context.logger,
      } as unknown as AuthenticatedRequest;

      await expect(
        controller.getDepartment(mockRequest, dept.id)
      ).rejects.toThrow("not found");
    });
  });
});
