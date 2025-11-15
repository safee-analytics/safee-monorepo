import { describe, it, expect } from "vitest";
import { chunkArray } from "./chunkArray.js";

void describe("chunkArray", () => {
  void it("perfect chunk size split", () => {
    expect(chunkArray([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  void it("remainder split", () => {
    expect(chunkArray([1, 2, 3, 4], 3)).toEqual([[1, 2, 3], [4]]);
  });

  void it("work with any type", () => {
    expect(chunkArray(["a", "b", "c", "d"], 3)).toEqual([["a", "b", "c"], ["d"]]);
  });

  void it("should error with negative chunk size", () => {
    expect(() => chunkArray([1, 2, 3, 4], -1)).toThrow();
  });

  void it("should error with 0 chunk size", () => {
    expect(() => chunkArray([1, 2, 3, 4], 0)).toThrow();
  });

  void it("should error with decimal chunk size", () => {
    expect(() => chunkArray([1, 2, 3, 4], 1.5)).toThrow();
  });
});
