import { describe, it, expect } from "vitest";
import { findDuplicates } from "./duplicate-check.js";

void describe("findDuplicatesWithCounts", () => {
  void it("should return undefined when no duplicates ", () => {
    expect(findDuplicates(["test", "test2"])).toBe(undefined);
  });
  void it("should return undefined when empty", () => {
    expect(findDuplicates([])).toBe(undefined);
  });
  void it("should return duplicates", () => {
    expect(findDuplicates(["test", "test", "unique"])).toEqual(["test"]);
  });
  void it("should return duplicates 2", () => {
    expect(findDuplicates([1, 1, 0, 2, 5, 2])).toEqual([1, 2]);
  });
});
