import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import {
  createTestOrganization,
  createTestUser,
  type TestOrganization,
  type TestUser,
} from "../test-helpers/test-fixtures.js";
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
  getScopesByCase,
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
  getNotesByCase,
  updateNote,
  createAssignment,
  getAssignmentsByCase,
  deleteAssignment,
  createHistoryEntry,
  getHistoryByCase,
} from "./cases.js";
import type { TemplateStructure } from "./types.js";

async function wipeAllTestData(drizzle: DrizzleClient) {
  // Delete in proper order to handle foreign key constraints
  await drizzle.delete(schema.caseHistory);
  await drizzle.delete(schema.caseAssignments);
  await drizzle.delete(schema.caseNotes);
  await drizzle.delete(schema.caseDocuments);
  await drizzle.delete(schema.auditProcedures);
  await drizzle.delete(schema.auditSections);
  await drizzle.delete(schema.auditScopes);
  await drizzle.delete(schema.auditTemplates);
  await drizzle.delete(schema.cases);
  await drizzle.delete(schema.users);
  await drizzle.delete(schema.organizations);
}

void describe("Cases Module", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;
  let testOrg: TestOrganization;
  let testUser: TestUser;
  let testAdminUser: TestUser;

  before(async () => {
    ({ drizzle, close } = testConnect("cases-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  beforeEach(async () => {
    // Clean all data before each test
    await wipeAllTestData(drizzle);

    // Create fresh test fixtures for each test
    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, testOrg.id);
    testAdminUser = await createTestUser(drizzle, testOrg.id, { role: "admin" });
  });

  void describe("Case Management", async () => {
    void it("creates case successfully", async () => {
      const caseData = {
        organizationId: testOrg.id,
        caseNumber: "CASE-001",
        clientName: "Test Client",
        auditType: "ICV",
        status: "pending" as const,
        priority: "medium" as const,
        createdBy: testUser.id,
      };

      const newCase = await createCase(deps, caseData);

      assert.ok(newCase.id);
      assert.strictEqual(newCase.caseNumber, "CASE-001");
      assert.strictEqual(newCase.clientName, "Test Client");
      assert.strictEqual(newCase.auditType, "ICV");
      assert.strictEqual(newCase.status, "pending");
    });

    void it("gets case by ID", async () => {
      const caseData = {
        organizationId: testOrg.id,
        caseNumber: "CASE-002",
        clientName: "Test Client 2",
        auditType: "ISO 9001",
        createdBy: testUser.id,
      };

      const created = await createCase(deps, caseData);
      const found = await getCaseById(deps, created.id);

      assert.ok(found);
      assert.strictEqual(found.id, created.id);
      assert.strictEqual(found.caseNumber, "CASE-002");
    });

    void it("gets cases by organization", async () => {
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
        auditType: "ISO 9001",
        createdBy: testUser.id,
      });

      const cases = await getCasesByOrganization(deps, testOrg.id);

      assert.strictEqual(cases.length, 2);
      assert.ok(cases.some((c) => c.caseNumber === "CASE-003"));
      assert.ok(cases.some((c) => c.caseNumber === "CASE-004"));
    });

    void it("updates case", async () => {
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

      assert.strictEqual(updated.status, "in-progress");
      assert.strictEqual(updated.priority, "high");
    });

    void it("deletes case", async () => {
      const created = await createCase(deps, {
        organizationId: testOrg.id,
        caseNumber: "CASE-006",
        clientName: "Client D",
        auditType: "ICV",
        createdBy: testUser.id,
      });

      await deleteCase(deps, created.id);

      const found = await getCaseById(deps, created.id);
      assert.strictEqual(found, undefined);
    });
  });

  void describe("Template Management", async () => {
    void it("creates template successfully", async () => {
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
        auditType: "ICV",
        structure,
        createdBy: testUser.id,
      };

      const template = await createTemplate(deps, templateData);

      assert.ok(template.id);
      assert.strictEqual(template.name, "Test Template");
      assert.strictEqual(template.auditType, "ICV");
      assert.ok(template.structure.sections.length > 0);
    });

    void it("gets template by ID", async () => {
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
        auditType: "ISO 9001",
        structure,
        createdBy: testUser.id,
      });

      const found = await getTemplateById(deps, created.id);

      assert.ok(found);
      assert.strictEqual(found.id, created.id);
      assert.strictEqual(found.name, "Template 2");
    });

    void it("gets public templates", async () => {
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

      assert.ok(publicTemplates.length > 0);
      assert.ok(publicTemplates.some((t) => t.name === "Public Template"));
    });
  });

  void describe("Scope Management", async () => {
    void it("creates scope successfully", async () => {
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

      assert.ok(scope.id);
      assert.strictEqual(scope.name, "ICV Scope");
      assert.strictEqual(scope.status, "draft");
    });

    void it("creates scope from template", async () => {
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

      assert.ok(scope.id);
      assert.strictEqual(scope.templateId, template.id);

      const sections = await getSectionsByScopeId(deps, scope.id);
      assert.strictEqual(sections.length, 1);
      assert.strictEqual(sections[0].name, "Section 1");

      const procedures = await getProceduresBySectionId(deps, sections[0].id);
      assert.strictEqual(procedures.length, 2);
      assert.ok(procedures.some((p) => p.referenceNumber === "1.1"));
      assert.ok(procedures.some((p) => p.referenceNumber === "1.2"));
    });

    void it("updates scope status", async () => {
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

      assert.strictEqual(updated.status, "completed");
      assert.strictEqual(updated.completedBy, testUser.id);
      assert.ok(updated.completedAt);
    });
  });

  void describe("Procedure Management", async () => {
    void it("completes procedure with field data", async () => {
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

      assert.strictEqual(completed.isCompleted, true);
      assert.strictEqual(completed.completedBy, testUser.id);
      assert.ok(completed.completedAt);
      assert.deepStrictEqual(completed.fieldData, { customField1: "value1", customField2: 123 });
      assert.strictEqual(completed.memo, "Test memo");
    });
  });

  void describe("Document Management", async () => {
    void it("creates and soft deletes document", async () => {
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

      assert.ok(document.id);
      assert.strictEqual(document.fileName, "test.pdf");

      let documents = await getDocumentsByCase(deps, testCase.id);
      assert.strictEqual(documents.length, 1);

      await softDeleteDocument(deps, document.id);

      documents = await getDocumentsByCase(deps, testCase.id);
      assert.strictEqual(documents.length, 0);
    });
  });

  void describe("Note Management", async () => {
    void it("creates and updates note", async () => {
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

      assert.ok(note.id);
      assert.strictEqual(note.content, "Initial observation");
      assert.strictEqual(note.isEdited, false);

      const updated = await updateNote(deps, note.id, {
        content: "Updated observation",
      });

      assert.strictEqual(updated.content, "Updated observation");
      assert.strictEqual(updated.isEdited, true);
    });
  });

  void describe("Assignment Management", async () => {
    void it("creates and deletes assignment", async () => {
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

      assert.strictEqual(assignment.caseId, testCase.id);
      assert.strictEqual(assignment.role, "lead");

      let assignments = await getAssignmentsByCase(deps, testCase.id);
      assert.strictEqual(assignments.length, 1);

      await deleteAssignment(deps, testCase.id, testUser.id);

      assignments = await getAssignmentsByCase(deps, testCase.id);
      assert.strictEqual(assignments.length, 0);
    });
  });

  void describe("History Management", async () => {
    void it("creates history entry with changes", async () => {
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

      assert.ok(history.id);
      assert.strictEqual(history.action, "updated");
      assert.deepStrictEqual(history.changesBefore, { status: "pending" });
      assert.deepStrictEqual(history.changesAfter, { status: "in-progress" });

      const caseHistory = await getHistoryByCase(deps, testCase.id);
      assert.strictEqual(caseHistory.length, 1);
      assert.strictEqual(caseHistory[0].action, "updated");
    });
  });
});
