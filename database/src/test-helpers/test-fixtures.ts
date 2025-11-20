import type { InferSelectModel } from "drizzle-orm";
import type { DrizzleClient } from "../index.js";
import { organizations, users, members, jobs, jobSchedules } from "../drizzle/index.js";
import { approvalWorkflows } from "../drizzle/approvalWorkflows.js";
import { approvalWorkflowSteps } from "../drizzle/approvalWorkflowSteps.js";
import { approvalRules } from "../drizzle/approvalRules.js";
import { approvalRequests } from "../drizzle/approvalRequests.js";
import { approvalSteps } from "../drizzle/approvalSteps.js";
import { cases } from "../drizzle/cases.js";
import { auditTemplates } from "../drizzle/auditTemplates.js";
import { auditScopes } from "../drizzle/auditScopes.js";
import { auditSections } from "../drizzle/auditSections.js";
import { auditProcedures } from "../drizzle/auditProcedures.js";
import { caseAssignments } from "../drizzle/caseAssignments.js";
import { caseDocuments } from "../drizzle/caseDocuments.js";
import { caseNotes } from "../drizzle/caseNotes.js";
import { caseHistory } from "../drizzle/caseHistory.js";
import { connectors } from "../drizzle/connectors.js";
import { notifications } from "../drizzle/notifications.js";
import { notificationSettings } from "../drizzle/notificationSettings.js";
import { sessions } from "../drizzle/sessions.js";
import { oauthAccounts } from "../drizzle/oauthAccounts.js";
import { verifications } from "../drizzle/verifications.js";
import { loginAttempts } from "../drizzle/loginAttempts.js";
import { securityEvents } from "../drizzle/securityEvents.js";

export type TestOrganization = InferSelectModel<typeof organizations>;
export type TestUser = InferSelectModel<typeof users>;
export type TestMember = InferSelectModel<typeof members>;

let testCounter = 0;

export interface TestFixtures {
  organization: TestOrganization;
  user: TestUser;
  adminUser: TestUser;
}

export async function createTestOrganization(
  db: DrizzleClient,
  data?: { name?: string; slug?: string },
): Promise<TestOrganization> {
  testCounter++;
  const [org] = await db
    .insert(organizations)
    .values({
      name: data?.name ?? "Test Organization",
      slug: data?.slug ?? `test-org-${Date.now()}-${testCounter}`,
    })
    .returning();

  return org;
}

export async function createTestUser(
  db: DrizzleClient,
  data?: {
    email?: string;
    name?: string;
    role?: string;
  },
): Promise<TestUser> {
  testCounter++;
  const [user] = await db
    .insert(users)
    .values({
      email: data?.email ?? `user-${Date.now()}-${testCounter}@test.com`,
      name: data?.name ?? "Test User",
      role: data?.role ?? "user",
      isActive: true,
    })
    .returning();

  return user;
}

export async function addMemberToOrganization(
  db: DrizzleClient,
  userId: string,
  organizationId: string,
  role = "member",
): Promise<TestMember> {
  const [member] = await db
    .insert(members)
    .values({
      userId,
      organizationId,
      role,
    })
    .returning();

  return member;
}

export async function createTestFixtures(db: DrizzleClient): Promise<TestFixtures> {
  const organization = await createTestOrganization(db);

  const user = await createTestUser(db, {
    email: "user@test.com",
    name: "Test User",
    role: "user",
  });

  const adminUser = await createTestUser(db, {
    email: "admin@test.com",
    name: "Admin User",
    role: "admin",
  });

  await addMemberToOrganization(db, user.id, organization.id, "member");
  await addMemberToOrganization(db, adminUser.id, organization.id, "admin");

  return {
    organization,
    user,
    adminUser,
  };
}

export async function cleanTestData(db: DrizzleClient): Promise<void> {
  await db.delete(approvalSteps);
  await db.delete(approvalRequests);
  await db.delete(approvalWorkflowSteps);
  await db.delete(approvalRules);
  await db.delete(approvalWorkflows);

  await db.delete(users);
  await db.delete(jobs);
  await db.delete(organizations);
}

export async function createTestApprovalWorkflow(
  db: DrizzleClient,
  organizationId: string,
  approverId: string,
  options?: {
    entityType?: string;
    stepType?: "single" | "parallel" | "any";
    approverType?: "user" | "role" | "team";
    minApprovals?: number;
  },
) {
  const {
    entityType = "invoice",
    stepType = "single",
    approverType = "user",
    minApprovals = 1,
  } = options ?? {};

  const [workflow] = await db
    .insert(approvalWorkflows)
    .values({
      name: "Test Approval Workflow",
      organizationId,
      entityType: entityType as never,
      isActive: true,
      rules: {},
    })
    .returning();

  const [workflowStep] = await db
    .insert(approvalWorkflowSteps)
    .values({
      workflowId: workflow.id,
      stepOrder: 1,
      stepType,
      approverType,
      approverId,
      minApprovals,
      requiredApprovers: minApprovals,
    })
    .returning();

  const [rule] = await db
    .insert(approvalRules)
    .values({
      organizationId,
      entityType: entityType as never,
      ruleName: "Test Rule",
      conditions: {
        conditions: [{ type: "manual" }],
        logic: "AND",
      },
      workflowId: workflow.id,
      priority: 1,
    })
    .returning();

  return { workflow, workflowStep, rule };
}

export async function createTestRoleWithMembers(
  db: DrizzleClient,
  organizationId: string,
  userIds: string[],
  roleName = "manager",
) {
  const memberValues = userIds.map((userId) => ({
    userId,
    organizationId,
    role: roleName,
  }));

  const membersList = await db.insert(members).values(memberValues).returning();

  return { roleName, members: membersList };
}

export async function nukeDatabase(db: DrizzleClient): Promise<void> {
  await db.delete(caseHistory);
  await db.delete(caseNotes);
  await db.delete(caseDocuments);
  await db.delete(caseAssignments);
  await db.delete(cases);
  await db.delete(auditProcedures);
  await db.delete(auditSections);
  await db.delete(auditScopes);
  await db.delete(auditTemplates);
  await db.delete(approvalSteps);
  await db.delete(approvalRequests);
  await db.delete(approvalWorkflowSteps);
  await db.delete(approvalRules);
  await db.delete(approvalWorkflows);
  await db.delete(notifications);
  await db.delete(notificationSettings);
  await db.delete(connectors);
  await db.delete(securityEvents);
  await db.delete(loginAttempts);
  await db.delete(verifications);
  await db.delete(oauthAccounts);
  await db.delete(sessions);
  await db.delete(jobs);
  await db.delete(jobSchedules);
  await db.delete(members);
  await db.delete(users);
  await db.delete(organizations);
}
