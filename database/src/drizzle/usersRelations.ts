import { relations } from "drizzle-orm";
import { users } from "./users.js";
import { userServices } from "./userServices.js";
import { members } from "./members.js";
import { teamMembers } from "./teamMembers.js";
import { twoFactors } from "./twoFactors.js";
import { apikeys } from "./apikeys.js";
import { sessions } from "./sessions.js";
import { oauthAccounts } from "./oauthAccounts.js";
import { cases } from "./cases.js";
import { auditTemplates } from "./auditTemplates.js";
import { auditScopes } from "./auditScopes.js";
import { auditSections } from "./auditSections.js";
import { auditProcedures } from "./auditProcedures.js";
import { auditPlans } from "./auditPlans.js";
import { auditReports } from "./auditReports.js";
import { caseDocuments } from "./caseDocuments.js";
import { caseNotes } from "./caseNotes.js";
import { caseAssignments } from "./caseAssignments.js";
import { caseHistory } from "./caseHistory.js";
import { approvalRequests } from "./approvalRequests.js";
import { approvalSteps } from "./approvalSteps.js";
import { notificationSettings } from "./notificationSettings.js";
import { appearanceSettings } from "./appearanceSettings.js";

export const usersRelations = relations(users, ({ many, one }) => ({
  userServices: many(userServices),
  members: many(members),
  teamMemberships: many(teamMembers),
  twoFactors: many(twoFactors),
  apiKeys: many(apikeys),
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  // Audit/Cases relations
  createdCases: many(cases, { relationName: "caseCreator" }),
  createdTemplates: many(auditTemplates),
  createdPlans: many(auditPlans, { relationName: "auditPlanCreator" }),
  createdScopes: many(auditScopes, { relationName: "auditScopeCreator" }),
  completedScopes: many(auditScopes, { relationName: "auditScopeCompletor" }),
  archivedScopes: many(auditScopes, { relationName: "auditScopeArchiver" }),
  completedSections: many(auditSections),
  completedProcedures: many(auditProcedures),
  uploadedDocuments: many(caseDocuments),
  createdNotes: many(caseNotes),
  caseAssignments: many(caseAssignments, { relationName: "caseAssignmentUser" }),
  madeAssignments: many(caseAssignments, { relationName: "caseAssignmentAssigner" }),
  historyChanges: many(caseHistory),
  // Approval relations
  requestedApprovals: many(approvalRequests, { relationName: "approvalRequestUser" }),
  approvalSteps: many(approvalSteps, { relationName: "approvalStepApprover" }),
  delegatedApprovalSteps: many(approvalSteps, { relationName: "approvalStepDelegatedTo" }),
  // Report relations
  generatedReports: many(auditReports, { relationName: "reportGenerator" }),
  // Settings relations
  notificationSettings: one(notificationSettings),
  appearanceSettings: one(appearanceSettings),
}));
