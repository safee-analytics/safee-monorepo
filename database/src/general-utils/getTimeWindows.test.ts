import { describe, it, expect } from "vitest";
import { getTimeWindows } from "./getTimeWindows.js";

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

describe("getTimeWindows", () => {
  it("should return consistent windows", () => {
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

    expect(result1).toEqual(expectedWindows);
    expect(result2).toEqual(expectedWindows);

    expect(result3.lastWindow).toEqual(expectedWindows.nextWindow);
  });
});
