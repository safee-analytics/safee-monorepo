import { addMinutes, differenceInMinutes } from "date-fns";

export function getTimeWindows(windowSizeInMinutes: number, curTime: Date) {
  const year = curTime.getUTCFullYear();
  const firstWindowTime = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));

  const minutesSinceFirstWindow = differenceInMinutes(curTime, firstWindowTime);
  const currentWindowIndex = Math.floor(minutesSinceFirstWindow / windowSizeInMinutes);

  const lastWindow = addMinutes(firstWindowTime, currentWindowIndex * windowSizeInMinutes);
  const nextWindow = addMinutes(lastWindow, windowSizeInMinutes);

  return { lastWindow, nextWindow };
}
