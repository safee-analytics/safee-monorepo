import type { DrizzleClient } from "../index.js";
import {
  caseHistory,
  caseNotes,
  caseDocuments,
  caseAssignments,
  approvalSteps,
  approvalRequests,
  fileEncryptionMetadata,
  auditorAccess,
  userKeypairs,
  resourceAssignments,
  cases,
  auditProcedures,
  auditSections,
  templateInstances,
  templates,
  approvalWorkflowSteps,
  approvalRules,
  approvalWorkflows,
  notifications,
  notificationSettings,
  connectors,
  securityEvents,
  loginAttempts,
  verifications,
  oauthAccounts,
  sessions,
  jobs,
  jobSchedules,
  members,
  encryptionKeys,
  users,
  organizations,
  hrPayslipLines,
  hrPayslips,
  hrLeaveRequests,
  hrLeaveAllocations,
  hrLeaveTypes,
  hrContracts,
  hrEmployees,
  hrDepartments,
  crmActivities,
  crmLeads,
  crmStages,
  crmContacts,
  crmTeams,
  crmLostReasons,
  documentTemplates,
} from "../drizzle/index.js";

/**
 * Clean all test data from database
 * Deletes in correct order to respect foreign key constraints
 */
export async function cleanTestData(db: DrizzleClient): Promise<void> {
  // Delete in reverse dependency order
  await db.delete(caseHistory);
  await db.delete(caseNotes);
  await db.delete(caseDocuments);
  await db.delete(caseAssignments);
  await db.delete(approvalSteps);
  await db.delete(approvalRequests);
  await db.delete(fileEncryptionMetadata);
  await db.delete(auditorAccess);
  await db.delete(userKeypairs);
  await db.delete(resourceAssignments);
  await db.delete(cases);
  await db.delete(auditProcedures);
  await db.delete(auditSections);
  await db.delete(templateInstances);
  await db.delete(templates);
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
  await db.delete(encryptionKeys);
  await db.delete(users);
  await db.delete(organizations);
  await db.delete(hrPayslipLines);
  await db.delete(hrPayslips);
  await db.delete(hrLeaveRequests);
  await db.delete(hrLeaveAllocations);
  await db.delete(hrLeaveTypes);
  await db.delete(hrContracts);
  await db.delete(hrEmployees);
  await db.delete(hrDepartments);
  await db.delete(crmActivities);
  await db.delete(crmLeads);
  await db.delete(crmStages);
  await db.delete(crmContacts);
  await db.delete(crmTeams);
  await db.delete(crmLostReasons);
  await db.delete(documentTemplates);
}

/**
 * @deprecated Use cleanTestData instead
 * Alias for backward compatibility
 */
export const nukeDatabase = cleanTestData;
