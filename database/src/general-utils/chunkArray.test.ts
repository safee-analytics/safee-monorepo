import { describe, it } from "node:test";
import assert from "node:assert";
import { chunkArray } from "./chunkArray.js";

await describe("chunkArray", async () => {
  await it("perfect chunk size split", () => {
    assert.deepEqual(chunkArray([1, 2, 3, 4], 2), [
      [1, 2],
      [3, 4],
    ]);
  });

  await it("remainder split", () => {
    assert.deepEqual(chunkArray([1, 2, 3, 4], 3), [[1, 2, 3], [4]]);
  });

  await it("work with any type", () => {
    assert.deepEqual(chunkArray(["a", "b", "c", "d"], 3), [["a", "b", "c"], ["d"]]);
  });

  await it("should error with negative chunk size", async () => {
    await assert.rejects(async () => chunkArray([1, 2, 3, 4], -1), Error);
  });

  await it("should error with 0 chunk size", async () => {
    await assert.rejects(async () => chunkArray([1, 2, 3, 4], 0), Error);
  });

  await it("should error with decimal chunk size", async () => {
    await assert.rejects(async () => chunkArray([1, 2, 3, 4], 1.5), Error);
  });
});
