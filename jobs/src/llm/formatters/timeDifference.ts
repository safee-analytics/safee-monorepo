export function formatTimeDifference(timestamp: Date, past = true): string {
  const now = new Date();
  const diff = past ? now.getTime() - timestamp.getTime() : timestamp.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const seconds = Math.floor(diff / 1000) % 86400;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const timePhrase = past ? "ago" : "in";

  if (days > 0) {
    const dayPart = `${days} day${days > 1 ? "s" : ""}`;
    const hourPart = hours > 0 ? ` ${hours} hour${hours !== 1 ? "s" : ""}` : "";
    return past ? `${dayPart}${hourPart} ${timePhrase}` : `${timePhrase} ${dayPart}${hourPart}`;
  }
  if (hours > 0) {
    const hourPart = `${hours} hour${hours > 1 ? "s" : ""}`;
    const minutePart = minutes > 0 ? ` ${minutes} minute${minutes !== 1 ? "s" : ""}` : "";
    return past ? `${hourPart}${minutePart} ${timePhrase}` : `${timePhrase} ${hourPart}${minutePart}`;
  }
  if (minutes > 0) {
    return past
      ? `${minutes} minute${minutes > 1 ? "s" : ""} ${timePhrase}`
      : `${timePhrase} ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  return past ? "a few seconds ago" : "in a few seconds";
}
