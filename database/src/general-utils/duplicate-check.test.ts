import { describe, it } from "node:test";
import assert from "node:assert";
import { findDuplicates } from "./duplicate-check.js";

await describe("findDuplicatesWithCounts", async () => {
  await it("should return undefined when no duplicates ", () => {
    assert.equal(findDuplicates(["test", "test2"]), undefined);
  });
  await it("should return undefined when empty", () => {
    assert.equal(findDuplicates([]), undefined);
  });
  await it("should return duplicates", () => {
    assert.deepEqual(findDuplicates(["test", "test", "unique"]), ["test"]);
  });
  await it("should return duplicates 2", () => {
    assert.deepEqual(findDuplicates([1, 1, 0, 2, 5, 2]), [1, 2]);
  });
});
