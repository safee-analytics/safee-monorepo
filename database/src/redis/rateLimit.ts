import { RedisClient } from "../index.js";

export async function redisFixedWindowRateLimit({
  redis,
  keyName,
  rateLimitWindowSeconds,
  maxCountPerWindow,
}: {
  redis: RedisClient;
  keyName: string;
  rateLimitWindowSeconds: number;
  maxCountPerWindow: number;
}) {
  const multi = redis.multi();
  multi.incr(keyName); // INCR returns 1 if the key was not previously set / expired and returns the updated count
  multi.expire(keyName, rateLimitWindowSeconds, "NX"); // with 'NX' only set the expiration window if it wasn't previously set
  const replies = await multi.exec();

  const requestCount = replies[0];
  if (typeof requestCount !== "number")
    // Should never happen if above "multi" code is correct
    throw new Error(`Redis operations returned not number and was instead: ${JSON.stringify(requestCount)}`);

  return { overRateLimit: requestCount > maxCountPerWindow, requestCount };
}
