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
  multi.incr(keyName);
  multi.expire(keyName, rateLimitWindowSeconds, "NX");
  const replies = await multi.exec();

  const requestCount = replies[0];
  if (typeof requestCount !== "number")
    throw new Error(`Redis operations returned not number and was instead: ${JSON.stringify(requestCount)}`);

  return { overRateLimit: requestCount > maxCountPerWindow, requestCount };
}
