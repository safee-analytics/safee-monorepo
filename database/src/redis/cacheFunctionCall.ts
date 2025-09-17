import { RedisClient } from "../index.js";
import { z } from "zod";

// ex use: cacheFunctionCall(redis, ID, {name: "bob"}, z.int(), async () => redis.incr(INCR_KEY));
// can see in the example use that the 'actualFunction' can still have params just needs to be wrapped in anonymous function
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
    try {
      const parsedRes = schema.safeParse(JSON.parse(res));
      if (parsedRes.success) return parsedRes.data;
    } catch {
      // mostly catching if json parse fails for some reason
    }
  }

  const newRes = await actualFunction();
  await redis.set(key, JSON.stringify(newRes));
  return newRes;
}
