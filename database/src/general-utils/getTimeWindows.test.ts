import { describe, it } from "node:test";
import assert from "node:assert";
import { getTimeWindows } from "./getTimeWindows.js";

// small wrapper for new date for test readability
function createUtcDate({
  year,
  month,
  day,
  hour,
  minute,
  second,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}) {
  return new Date(Date.UTC(year, month, day, hour, minute, second, 0));
}

await describe("getTimeWindows", async () => {
  await it("should return consistent windows", () => {
    const baseDate = {
      year: 2024,
      month: 0,
      day: 1,
      hour: 0,
      minute: 0,
    };

    const curTime1 = createUtcDate({ ...baseDate, second: 1 });
    const curTime2 = createUtcDate({ ...baseDate, second: 31 });
    const curTime3 = createUtcDate({ ...baseDate, second: 31, minute: 2 });
    const result1 = getTimeWindows(2, curTime1);
    const result2 = getTimeWindows(2, curTime2);
    const result3 = getTimeWindows(2, curTime3);

    const expectedWindows = {
      lastWindow: createUtcDate({ ...baseDate, second: 0 }),
      nextWindow: createUtcDate({ ...baseDate, second: 0, minute: 2 }),
    };
    // these two should have the same expected windows because they're within the same window time frame
    assert.deepStrictEqual(result1, expectedWindows);
    assert.deepStrictEqual(result2, expectedWindows);

    // this one should be in the next window
    assert.deepStrictEqual(result3.lastWindow, expectedWindows.nextWindow);
  });
});
