import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import type { DbDeps } from "../deps.js";
import { createTestOrganization, type TestOrganization } from "../test-helpers/organizations.js";
import { createTestUser, type TestUser } from "../test-helpers/users.js";
import { nukeDatabase } from "../test-helpers/cleanup.js";
import {
  createCase,
  getCaseById,
  getCasesByOrganization,
  updateCase,
  deleteCase,
  createTemplate,
  getTemplateById,
  getPublicTemplates,
  createScope,
  createScopeFromTemplate,
  updateScopeStatus,
  createSection,
  getSectionsByScopeId,
  createProcedure,
  getProceduresBySectionId,
  completeProcedure,
  createDocument,
  getDocumentsByCase,
  softDeleteDocument,
  createNote,
  updateNote,
  createAssignment,
  getAssignmentsByCase,
  deleteAssignment,
  createHistoryEntry,
  getHistoryByCase,
} from "./cases.js";
import type { TemplateStructure } from "./types.js";

describe("Cases Module", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let testAdminUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = testConnect("cases-test"));
    deps = { drizzle, logger };
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle);
    testAdminUser = await createTestUser(drizzle, { role: "admin" });
  });

  describe("Case Management", async () => {
    it("creates case successfully", async () => {
      const caseData = {
        organizationId: testOrg.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
        auditType: "ICV" as const,
        status: "pending" as const,
        priority: "medium" as const,
        createdBy: testUser.id,
      };

      const newCase = await createCase(deps, caseData);

      expect(newCase.id).toBeTruthy();
      expect(newCase.caseNumber).toBe("CASE-001");
      expect(newCase.clientName).toBe("Test Client");
      expect(newCase.auditType).toBe("ICV");
      expect(newCase.status).toBe("pending");
    });

    it("gets case by ID", async () => {
      const caseData = {
        organizationId: testOrg.id,
        caseNumber: "CASE-002",
        clientName: "Test Client 2",
        auditType: "ISO_9001" as const,
        createdBy: testUser.id,
      };

      const created = await createCase(deps, caseData);
      const found = await getCaseById(deps, created.id);

      expect(found).toBeTruthy();
      expect(found!.id).toBe(created.id);
      expect(found!.caseNumber).toBe("CASE-002");
    });

    it("gets cases by organization", async () => {
      await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-003",
        clientName: "Client A",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-004",
        clientName: "Client B",
        auditType: "ISO_9001" as const,
        createdBy: testUser.id,
      });

      const cases = await getCasesByOrganization(deps, testOrg.id);

      expect(cases.length).toBe(2);
      expect(cases.some((c) => c.caseNumber === "CASE-003")).toBeTruthy();
      expect(cases.some((c) => c.caseNumber === "CASE-004")).toBeTruthy();
    });

    it("updates case", async () => {
      const created = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-005",
        clientName: "Client C",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const updated = await updateCase(deps, created.id, {
        status: "in-progress",
        priority: "high",
      });

      expect(updated.status).toBe("in-progress");
      expect(updated.priority).toBe("high");
    });

    it("deletes case", async () => {
      const created = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-006",
        clientName: "Client D",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      await deleteCase(deps, created.id);

      const found = await getCaseById(deps, created.id);
      expect(found).toBe(undefined);
    });
  });

  describe("Template Management", async () => {
    it("creates template successfully", async () => {
      const structure: TemplateStructure = {
        sections: [
          {
            name: "Section A",
            sortOrder: 1,
            procedures: [
              {
                referenceNumber: "A.1",
                title: "Procedure 1",
                sortOrder: 1,
              },
            ],
          },
        ],
      };

      const templateData = {
        organizationId: testOrg.id,
        name: "Test Template",
        auditType: "ICV" as const,
        structure,
        createdBy: testUser.id,
      };

      const template = await createTemplate(deps, templateData);

      expect(template.id).toBeTruthy();
      expect(template.name).toBe("Test Template");
      expect(template.auditType).toBe("ICV");
      expect(template.structure.sections.length > 0).toBeTruthy();
    });

    it("gets template by ID", async () => {
      const structure: TemplateStructure = {
        sections: [
          {
            name: "Section B",
            sortOrder: 1,
            procedures: [
              {
                referenceNumber: "B.1",
                title: "Procedure 1",
                sortOrder: 1,
              },
            ],
          },
        ],
      };

      const created = await createTemplate(deps, {
        organizationId: testOrg.id,
        name: "Template 2",
        auditType: "ISO_9001" as const,
        structure,
        createdBy: testUser.id,
      });

      const found = await getTemplateById(deps, created.id);

      expect(found).toBeTruthy();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe("Template 2");
    });

    it("gets public templates", async () => {
      const structure: TemplateStructure = {
        sections: [
          {
            name: "Public Section",
            sortOrder: 1,
            procedures: [
              {
                referenceNumber: "P.1",
                title: "Public Procedure",
                sortOrder: 1,
              },
            ],
          },
        ],
      };

      await createTemplate(deps, {
        name: "Public Template",
        auditType: "ICV",
        structure,
        isPublic: true,
        isActive: true,
        createdBy: testUser.id,
      });

      const publicTemplates = await getPublicTemplates(deps);

      expect(publicTemplates.length > 0).toBeTruthy();
      expect(publicTemplates.some((t) => t.name === "Public Template"));
    });
  });

  describe("Scope Management", async () => {
    it("creates scope successfully", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-007",
        clientName: "Client E",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const scope = await createScope(deps, {
        caseId: testCase.id,
        name: "ICV Scope",
        status: "draft",
        createdBy: testUser.id,
      });

      expect(scope.id).toBeTruthy();
      expect(scope.name).toBe("ICV Scope");
      expect(scope.status).toBe("draft");
    });

    it("creates scope from template", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-008",
        clientName: "Client F",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const structure: TemplateStructure = {
        sections: [
          {
            name: "Section 1",
            sortOrder: 1,
            procedures: [
              {
                referenceNumber: "1.1",
                title: "Procedure 1.1",
                sortOrder: 1,
              },
              {
                referenceNumber: "1.2",
                title: "Procedure 1.2",
                sortOrder: 2,
              },
            ],
          },
        ],
      };

      const template = await createTemplate(deps, {
        organizationId: testOrg.id,
        name: "ICV Template",
        auditType: "ICV",
        structure,
        createdBy: testUser.id,
      });

      const scope = await createScopeFromTemplate(deps, testCase.id, template.id, testUser.id);

      expect(scope.id).toBeTruthy();
      expect(scope.templateId).toBe(template.id);

      const sections = await getSectionsByScopeId(deps, scope.id);
      expect(sections.length).toBe(1);
      expect(sections[0].name).toBe("Section 1");

      const procedures = await getProceduresBySectionId(deps, sections[0].id);
      expect(procedures.length).toBe(2);
      expect(procedures.some((p) => p.referenceNumber === "1.1"));
      expect(procedures.some((p) => p.referenceNumber === "1.2"));
    });

    it("updates scope status", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-009",
        clientName: "Client G",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const scope = await createScope(deps, {
        caseId: testCase.id,
        name: "Test Scope",
        status: "draft",
        createdBy: testUser.id,
      });

      const updated = await updateScopeStatus(deps, scope.id, "completed", testUser.id);

      expect(updated.status).toBe("completed");
      expect(updated.completedBy).toBe(testUser.id);
      expect(updated.completedAt).toBeTruthy();
    });
  });

  describe("Procedure Management", async () => {
    it("completes procedure with field data", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-010",
        clientName: "Client H",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const scope = await createScope(deps, {
        caseId: testCase.id,
        name: "Test Scope",
        status: "draft",
        createdBy: testUser.id,
      });

      const section = await createSection(deps, {
        scopeId: scope.id,
        name: "Test Section",
        sortOrder: 1,
      });

      const procedure = await createProcedure(deps, {
        sectionId: section.id,
        referenceNumber: "T.1",
        title: "Test Procedure",
        sortOrder: 1,
      });

      const completed = await completeProcedure(deps, procedure.id, {
        completedBy: testUser.id,
        fieldData: { customField1: "value1", customField2: 123 },
        memo: "Test memo",
      });

      expect(completed.isCompleted).toBe(true);
      expect(completed.completedBy).toBe(testUser.id);
      expect(completed.completedAt).toBeTruthy();
      expect(completed.fieldData).toEqual({ customField1: "value1", customField2: 123 });
      expect(completed.memo).toBe("Test memo");
    });
  });

  describe("Document Management", async () => {
    it("creates and soft deletes document", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-011",
        clientName: "Client I",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const document = await createDocument(deps, {
        caseId: testCase.id,
        fileName: "test.pdf",
        fileSize: 1024,
        fileType: "application/pdf",
        storagePath: "/uploads/test.pdf",
        uploadedBy: testUser.id,
      });

      expect(document.id).toBeTruthy();
      expect(document.fileName).toBe("test.pdf");

      let documents = await getDocumentsByCase(deps, testCase.id);
      expect(documents.length).toBe(1);

      await softDeleteDocument(deps, document.id);

      documents = await getDocumentsByCase(deps, testCase.id);
      expect(documents.length).toBe(0);
    });
  });

  describe("Note Management", async () => {
    it("creates and updates note", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-012",
        clientName: "Client J",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const note = await createNote(deps, {
        caseId: testCase.id,
        noteType: "observation",
        content: "Initial observation",
        createdBy: testUser.id,
      });

      expect(note.id).toBeTruthy();
      expect(note.content).toBe("Initial observation");
      expect(note.isEdited).toBe(false);

      const updated = await updateNote(deps, note.id, {
        content: "Updated observation",
      });

      expect(updated.content).toBe("Updated observation");
      expect(updated.isEdited).toBe(true);
    });
  });

  describe("Assignment Management", async () => {
    it("creates and deletes assignment", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-013",
        clientName: "Client K",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const assignment = await createAssignment(deps, {
        caseId: testCase.id,
        userId: testUser.id,
        role: "lead",
        assignedBy: testAdminUser.id,
      });

      expect(assignment.caseId).toBe(testCase.id);
      expect(assignment.role).toBe("lead");

      let assignments = await getAssignmentsByCase(deps, testCase.id);
      expect(assignments.length).toBe(1);

      await deleteAssignment(deps, testCase.id, testUser.id);

      assignments = await getAssignmentsByCase(deps, testCase.id);
      expect(assignments.length).toBe(0);
    });
  });

  describe("History Management", async () => {
    it("creates history entry with changes", async () => {
      const testCase = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-014",
        clientName: "Client L",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      const history = await createHistoryEntry(deps, {
        caseId: testCase.id,
        entityType: "case",
        entityId: testCase.id,
        action: "updated",
        changesBefore: { status: "pending" },
        changesAfter: { status: "in-progress" },
        changedBy: testUser.id,
      });

      expect(history.id).toBeTruthy();
      expect(history.action).toBe("updated");
      expect(history.changesBefore).toEqual({ status: "pending" });
      expect(history.changesAfter).toEqual({ status: "in-progress" });

      const caseHistory = await getHistoryByCase(deps, testCase.id);
      expect(caseHistory.length).toBe(1);
      expect(caseHistory[0].action).toBe("updated");
    });
  });
});
