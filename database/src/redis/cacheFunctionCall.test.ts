import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { RedisClient, redisConnect } from "../index.js";
import { z } from "zod";

import { cacheFunctionCall } from "./cacheFunctionCall.js";

const ID = "1ba1953f-1b8f-4033-93fd-97aea34f0542";
const INCR_KEY = "INCR_KEYYYY";

void describe("redis cache function call", async () => {
  let redis: RedisClient;

  beforeAll(async () => {
    redis = await redisConnect();
  });

  beforeEach(async () => {
    await redis.flushDb();
  });

  afterAll(async () => {
    redis.destroy();
  });

  async function callCachedFunction(params: unknown, schema = z.int()) {
    return cacheFunctionCall(redis, ID, params, schema, async () => redis.incr(INCR_KEY));
  }

  await it("should call real function first time and then cache it the second", async () => {
    const params = { name: "bob" };
    const val = await callCachedFunction(params);
    const val2 = await callCachedFunction(params);

    expect(val).toBe(1);
    expect(val2).toBe(1);
  });

  await it("should call real function twice because of different params", async () => {
    const val = await callCachedFunction({ name: "bob" });
    const val2 = await callCachedFunction({ name: "frank" });

    expect(val).toBe(1);
    expect(val2).toBe(2);
  });

  await it("Updated schema should invalidate previous cache", async () => {
    const params = { name: "bob" };
    const val = await cacheFunctionCall(redis, ID, params, z.string(), async () => "hello");
    const val2 = await cacheFunctionCall(redis, ID, params, z.int(), async () => 1);

    expect(val).toBe("hello");
    expect(val2).toBe(1);
  });
});
