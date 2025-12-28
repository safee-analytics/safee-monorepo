import { RedisClient } from "../index.js";
import { z } from "zod";

export async function cacheFunctionCall<T>(
  redis: RedisClient,
  id: string,
  params: unknown,
  schema: z.ZodType<T>,
  actualFunction: () => Promise<T>,
): Promise<T> {
  const stringifiedJson = JSON.stringify(params);
  const key = `function_cache_${id}_${stringifiedJson}`;

  const res = await redis.get(key);
  if (res) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(res);
    } catch {
      parsedJson = null;
    }

    if (parsedJson !== null) {
      const parsedRes = schema.safeParse(parsedJson);
      if (parsedRes.success) return parsedRes.data;
    }
  }

  const newRes = await actualFunction();
  // Set 1 hour TTL on cache to prevent unbounded growth with noeviction policy
  await redis.set(key, JSON.stringify(newRes), { EX: 3600 });
  return newRes;
}
