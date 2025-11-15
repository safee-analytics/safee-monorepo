import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { type DrizzleClient, schema, eq, and, createTemplate as dbCreateTemplate } from "@safee/database";
import { connectTest } from "@safee/database/test-helpers";
import {
  createTestOrganization,
  createTestUser,
  nukeDatabase,
  type TestOrganization,
  type TestUser,
} from "@safee/database/test-helpers";
import { pino } from "pino";
import { createCase } from "./createCase.js";
import { createScopeFromTemplate } from "./createScopeFromTemplate.js";
import { NotFound, InsufficientPermissions } from "../../errors.js";
import type { TemplateStructure } from "../../dtos/cases.js";

void describe("createScopeFromTemplate operation", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  let testOrg: TestOrganization;
  let testUser: TestUser;

  beforeAll(async () => {
    ({ drizzle, close } = await connectTest({ appName: "create-scope-from-template-test" }));
  });

  beforeEach(async () => {
    await nukeDatabase(drizzle);

    testOrg = await createTestOrganization(drizzle);
    testUser = await createTestUser(drizzle, testOrg.id);
  });

  afterAll(async () => {
    await close();
  });

  void it("should create scope from template successfully", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-001",
      clientName: "Test Client",
      auditType: "ICV",
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
          ],
        },
      ],
    };

    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Test Template",
      auditType: "ICV",
      structure,
      isPublic: false,
      isActive: true,
      createdBy: testUser.id,
    });

    const result = await createScopeFromTemplate(drizzle, testOrg.id, testUser.id, testCase.id, template.id);

    expect(result.id).toBeDefined();
    expect(result.caseId).toBe(testCase.id);
    expect(result.templateId).toBe(template.id);
    expect(result.name).toBe("Test Template");
  });

  void it("should create history entry", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-002",
      clientName: "Test Client",
      auditType: "ICV",
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
          ],
        },
      ],
    };

    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Test Template",
      auditType: "ICV",
      structure,
      isPublic: true,
      isActive: true,
      createdBy: testUser.id,
    });

    await createScopeFromTemplate(drizzle, testOrg.id, testUser.id, testCase.id, template.id);

    const history = await drizzle
      .select()
      .from(schema.caseHistory)
      .where(and(eq(schema.caseHistory.caseId, testCase.id), eq(schema.caseHistory.entityType, "scope")));

    expect(history).toHaveLength(1);
    expect(history[0].action).toBe("created");
  });

  void it("should throw NotFound for non-existent case", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const structure: TemplateStructure = {
      sections: [],
    };

    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Test Template",
      auditType: "ICV",
      structure,
      isPublic: true,
      isActive: true,
      createdBy: testUser.id,
    });

    await expect(
      createScopeFromTemplate(drizzle, testOrg.id, testUser.id, "non-existent-id", template.id),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw NotFound for non-existent template", async () => {
    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-003",
      clientName: "Test Client",
      auditType: "ICV",
    });

    await expect(
      createScopeFromTemplate(drizzle, testOrg.id, testUser.id, testCase.id, "non-existent-id"),
    ).rejects.toThrow(NotFound);
  });

  void it("should throw InsufficientPermissions for different organization case", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };
    const testOrg2 = await createTestOrganization(drizzle);

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-004",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const structure: TemplateStructure = {
      sections: [],
    };

    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Test Template",
      auditType: "ICV",
      structure,
      isPublic: true,
      isActive: true,
      createdBy: testUser.id,
    });

    await expect(
      createScopeFromTemplate(drizzle, testOrg2.id, testUser.id, testCase.id, template.id),
    ).rejects.toThrow(InsufficientPermissions);
  });

  void it("should throw InsufficientPermissions for private template from different org", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };
    const testOrg2 = await createTestOrganization(drizzle);
    const testUser2 = await createTestUser(drizzle, testOrg2.id);

    const testCase = await createCase(drizzle, testOrg2.id, testUser2.id, {
      caseNumber: "CASE-005",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const structure: TemplateStructure = {
      sections: [],
    };

    // Private template from testOrg
    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Private Template",
      auditType: "ICV",
      structure,
      isPublic: false,
      isActive: true,
      createdBy: testUser.id,
    });

    await expect(
      createScopeFromTemplate(drizzle, testOrg2.id, testUser2.id, testCase.id, template.id),
    ).rejects.toThrow("You don't have permission to use this template");
  });

  void it("should allow public template from different org", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };
    const testOrg2 = await createTestOrganization(drizzle);
    const testUser2 = await createTestUser(drizzle, testOrg2.id);

    const testCase = await createCase(drizzle, testOrg2.id, testUser2.id, {
      caseNumber: "CASE-006",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const structure: TemplateStructure = {
      sections: [
        {
          name: "Public Section",
          sortOrder: 1,
          procedures: [],
        },
      ],
    };

    // Public template from testOrg
    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Public Template",
      auditType: "ICV",
      structure,
      isPublic: true,
      isActive: true,
      createdBy: testUser.id,
    });

    const result = await createScopeFromTemplate(
      drizzle,
      testOrg2.id,
      testUser2.id,
      testCase.id,
      template.id,
    );

    expect(result.templateId).toBe(template.id);
  });

  void it("should throw InvalidInput for inactive template", async () => {
    const logger = pino({ level: "silent" });
    const deps = { drizzle, logger };

    const testCase = await createCase(drizzle, testOrg.id, testUser.id, {
      caseNumber: "CASE-007",
      clientName: "Test Client",
      auditType: "ICV",
    });

    const structure: TemplateStructure = {
      sections: [],
    };

    const template = await dbCreateTemplate(deps, {
      organizationId: testOrg.id,
      name: "Inactive Template",
      auditType: "ICV",
      structure,
      isPublic: true,
      isActive: false,
      createdBy: testUser.id,
    });

    await expect(
      createScopeFromTemplate(drizzle, testOrg.id, testUser.id, testCase.id, template.id),
    ).rejects.toThrow("Cannot create scope from inactive template");
  });
});
