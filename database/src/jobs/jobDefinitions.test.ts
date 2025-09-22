import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { pino } from "pino";
import { testConnect } from "../drizzle/testConnect.js";
import type { DrizzleClient } from "../drizzle.js";
import {
  createJobDefinition,
  getJobDefinitionById,
  getJobDefinitionByName,
  getJobDefinitionByHandler,
  listActiveJobDefinitions,
  listJobDefinitions,
  updateJobDefinition,
  activateJobDefinition,
  deactivateJobDefinition,
  jobDefinitionExists,
} from "./jobDefinitions.js";
import * as schema from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";

async function wipeJobDefinitionsDb(drizzle: DrizzleClient) {
  await drizzle.delete(schema.jobLogs);
  await drizzle.delete(schema.jobs);
  await drizzle.delete(schema.jobSchedules);
  await drizzle.delete(schema.jobDefinitions);
}

void describe("Job Definitions", async () => {
  let drizzle: DrizzleClient;
  let close: () => Promise<void>;
  const logger = pino({ level: "silent" });
  let deps: DbDeps;

  before(async () => {
    ({ drizzle, close } = testConnect("job-definitions-test"));
    deps = { drizzle, logger };
  });

  after(async () => {
    await close();
  });

  void describe("createJobDefinition", async () => {
    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
    });

    void it("creates job definition successfully", async () => {
      const definitionData = {
        name: "TestJobDefinition",
        description: "A test job definition",
        handlerName: "TestJobHandler",
        defaultPayload: { test: true },
        maxRetries: 5,
        retryDelayMs: 2000,
        timeoutMs: 60000,
      };

      const jobDef = await createJobDefinition(deps, definitionData);

      assert.ok(jobDef.id);
      assert.strictEqual(jobDef.name, "TestJobDefinition");
      assert.strictEqual(jobDef.description, "A test job definition");
      assert.strictEqual(jobDef.handlerName, "TestJobHandler");
      assert.deepStrictEqual(jobDef.defaultPayload, { test: true });
      assert.strictEqual(jobDef.maxRetries, 5);
      assert.strictEqual(jobDef.retryDelayMs, 2000);
      assert.strictEqual(jobDef.timeoutMs, 60000);
      assert.strictEqual(jobDef.isActive, true);
    });

    void it("creates job definition with defaults", async () => {
      const definitionData = {
        name: "MinimalJobDefinition",
        handlerName: "MinimalHandler",
      };

      const jobDef = await createJobDefinition(deps, definitionData);

      assert.ok(jobDef.id);
      assert.strictEqual(jobDef.name, "MinimalJobDefinition");
      assert.strictEqual(jobDef.handlerName, "MinimalHandler");
      assert.strictEqual(jobDef.maxRetries, 3);
      assert.strictEqual(jobDef.retryDelayMs, 60000);
      assert.strictEqual(jobDef.timeoutMs, 300000);
      assert.strictEqual(jobDef.isActive, true);
    });

    void it("throws error when job definition with same name exists", async () => {
      const definitionData = {
        name: "DuplicateJobDefinition",
        handlerName: "TestHandler",
      };

      await createJobDefinition(deps, definitionData);

      await assert.rejects(
        async () => await createJobDefinition(deps, definitionData),
        /Job definition with name 'DuplicateJobDefinition' already exists/,
      );
    });
  });

  void describe("getJobDefinitionById", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "TestJobDefinition",
        handlerName: "TestHandler",
      });
    });

    void it("retrieves job definition by ID", async () => {
      const jobDef = await getJobDefinitionById(deps, testJobDefinition.id);

      assert.ok(jobDef);
      assert.strictEqual(jobDef.id, testJobDefinition.id);
      assert.strictEqual(jobDef.name, "TestJobDefinition");
    });

    void it("returns undefined for non-existent ID", async () => {
      const jobDef = await getJobDefinitionById(deps, "nonexistent-id");
      assert.strictEqual(jobDef, undefined);
    });
  });

  void describe("getJobDefinitionByName", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "UniqueJobDefinition",
        handlerName: "TestHandler",
      });
    });

    void it("retrieves job definition by name", async () => {
      const jobDef = await getJobDefinitionByName(deps, "UniqueJobDefinition");

      assert.ok(jobDef);
      assert.strictEqual(jobDef.id, testJobDefinition.id);
      assert.strictEqual(jobDef.name, "UniqueJobDefinition");
    });

    void it("returns undefined for non-existent name", async () => {
      const jobDef = await getJobDefinitionByName(deps, "NonExistentJob");
      assert.strictEqual(jobDef, undefined);
    });
  });

  void describe("getJobDefinitionByHandler", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "TestJobDefinition",
        handlerName: "UniqueTestHandler",
      });
    });

    void it("retrieves job definition by handler name", async () => {
      const jobDef = await getJobDefinitionByHandler(deps, "UniqueTestHandler");

      assert.ok(jobDef);
      assert.strictEqual(jobDef.id, testJobDefinition.id);
      assert.strictEqual(jobDef.handlerName, "UniqueTestHandler");
    });

    void it("returns undefined for non-existent handler", async () => {
      const jobDef = await getJobDefinitionByHandler(deps, "NonExistentHandler");
      assert.strictEqual(jobDef, undefined);
    });
  });

  void describe("listActiveJobDefinitions", async () => {
    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);

      await createJobDefinition(deps, {
        name: "ActiveJob1",
        handlerName: "ActiveHandler1",
        isActive: true,
      });

      await createJobDefinition(deps, {
        name: "ActiveJob2",
        handlerName: "ActiveHandler2",
        isActive: true,
      });

      const inactiveJob = await createJobDefinition(deps, {
        name: "InactiveJob",
        handlerName: "InactiveHandler",
        isActive: true,
      });

      // Deactivate one job
      await deactivateJobDefinition(deps, inactiveJob.id);
    });

    void it("returns only active job definitions", async () => {
      const activeJobs = await listActiveJobDefinitions(deps);

      assert.strictEqual(activeJobs.length, 2);
      assert.ok(activeJobs.every((job) => job.isActive));

      const names = activeJobs.map((job) => job.name).sort();
      assert.deepStrictEqual(names, ["ActiveJob1", "ActiveJob2"]);
    });

    void it("returns jobs ordered by name", async () => {
      const activeJobs = await listActiveJobDefinitions(deps);

      const names = activeJobs.map((job) => job.name);
      const sortedNames = [...names].sort();
      assert.deepStrictEqual(names, sortedNames);
    });
  });

  void describe("listJobDefinitions with pagination", async () => {
    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);

      for (let i = 1; i <= 5; i++) {
        await createJobDefinition(deps, {
          name: `Job${i.toString().padStart(2, "0")}`,
          handlerName: `Handler${i}`,
        });
      }
    });

    void it("returns all job definitions by default", async () => {
      const jobs = await listJobDefinitions(deps);

      assert.strictEqual(jobs.length, 5);
    });

    void it("respects limit parameter", async () => {
      const jobs = await listJobDefinitions(deps, { limit: 2 });

      assert.strictEqual(jobs.length, 2);
    });

    void it("respects page parameter", async () => {
      const firstPage = await listJobDefinitions(deps, { page: 1, limit: 2 });
      const secondPage = await listJobDefinitions(deps, { page: 2, limit: 2 });

      assert.strictEqual(firstPage.length, 2);
      assert.strictEqual(secondPage.length, 2);

      // Should have different jobs
      const firstPageIds = firstPage.map((job) => job.id);
      const secondPageIds = secondPage.map((job) => job.id);
      assert.ok(!firstPageIds.some((id) => secondPageIds.includes(id)));
    });

    void it("filters by isActive when specified", async () => {
      const firstJob = await listJobDefinitions(deps, { limit: 1 });
      await deactivateJobDefinition(deps, firstJob[0].id);

      const activeJobs = await listJobDefinitions(deps, { isActive: true });
      const allJobs = await listJobDefinitions(deps);

      assert.strictEqual(activeJobs.length, 4);
      assert.strictEqual(allJobs.length, 5);
    });
  });

  void describe("updateJobDefinition", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "TestJobDefinition",
        description: "Original description",
        handlerName: "TestHandler",
        maxRetries: 3,
      });
    });

    void it("updates job definition successfully", async () => {
      const updates = {
        description: "Updated description",
        maxRetries: 5,
        timeoutMs: 120000,
      };

      const updatedJobDef = await updateJobDefinition(deps, testJobDefinition.id, updates);

      assert.strictEqual(updatedJobDef.id, testJobDefinition.id);
      assert.strictEqual(updatedJobDef.description, "Updated description");
      assert.strictEqual(updatedJobDef.maxRetries, 5);
      assert.strictEqual(updatedJobDef.timeoutMs, 120000);
      assert.strictEqual(updatedJobDef.name, "TestJobDefinition"); // Should remain unchanged
    });

    void it("throws error when job definition not found", async () => {
      await assert.rejects(
        async () => await updateJobDefinition(deps, "nonexistent-id", { description: "New description" }),
        /Job definition with ID 'nonexistent-id' not found/,
      );
    });

    void it("updates updatedAt timestamp", async () => {
      const originalUpdatedAt = testJobDefinition.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updatedJobDef = await updateJobDefinition(deps, testJobDefinition.id, {
        description: "New description",
      });

      assert.ok(updatedJobDef.updatedAt > originalUpdatedAt);
    });
  });

  void describe("activateJobDefinition", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "TestJobDefinition",
        handlerName: "TestHandler",
        isActive: false,
      });
    });

    void it("activates job definition", async () => {
      const activatedJobDef = await activateJobDefinition(deps, testJobDefinition.id);

      assert.strictEqual(activatedJobDef.isActive, true);
    });
  });

  void describe("deactivateJobDefinition", async () => {
    let testJobDefinition: typeof schema.jobDefinitions.$inferSelect;

    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      testJobDefinition = await createJobDefinition(deps, {
        name: "TestJobDefinition",
        handlerName: "TestHandler",
        isActive: true,
      });
    });

    void it("deactivates job definition", async () => {
      const deactivatedJobDef = await deactivateJobDefinition(deps, testJobDefinition.id);

      assert.strictEqual(deactivatedJobDef.isActive, false);
    });
  });

  void describe("jobDefinitionExists", async () => {
    beforeEach(async () => {
      await wipeJobDefinitionsDb(drizzle);
      await createJobDefinition(deps, {
        name: "ExistingJobDefinition",
        handlerName: "TestHandler",
      });
    });

    void it("returns true when job definition exists", async () => {
      const exists = await jobDefinitionExists(deps, "ExistingJobDefinition");
      assert.strictEqual(exists, true);
    });

    void it("returns false when job definition does not exist", async () => {
      const exists = await jobDefinitionExists(deps, "NonExistentJobDefinition");
      assert.strictEqual(exists, false);
    });
  });
});
