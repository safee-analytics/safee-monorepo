import { createClient } from "redis";
import { REDIS_URL } from "../env.js";

export async function redisConnect(redisUrl?: string) {
  const url = redisUrl ?? REDIS_URL;
  if (url === undefined) throw new Error("Missing REDIS_URL");

  return createClient({
    url,
  }).connect();
}
