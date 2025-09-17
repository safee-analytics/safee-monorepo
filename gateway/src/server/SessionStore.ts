import type { RedisClient } from "@safee/database";
import { millisecondsToSeconds } from "date-fns";
import { SessionData, Store } from "express-session";
import { z } from "zod";

function noop(_err?: unknown, _session?: SessionData) {
  /* empty */
}

type Serializer = { stringify: (t: unknown) => string; parse: (data: string) => unknown };

type Options = {
  ttl?: number | ((session: SessionData) => number);
  serializer?: Serializer;
};

export const RedisSessionRuntime = z.object({
  data: z.unknown(),
  sid: z.string(),
});
type RedisSession = z.infer<typeof RedisSessionRuntime>;

// NOTE: Changing this env var will invalidate EVERY existing session, this is just for an oh shit button
export const SessionPrefixKey = process.env.SESSION_PREFIX_KEY ?? "";

function getRedisKey(id: string, prefixKey = SessionPrefixKey) {
  return `user-session-${prefixKey}${id}`;
}

async function setRedisUserSession(
  redis: RedisClient,
  sessionData: RedisSession,
  timeToLiveSeconds: number,
) {
  await redis.set(getRedisKey(sessionData.sid), JSON.stringify(sessionData), { EX: timeToLiveSeconds });
}

async function getRedisUserSession(redis: RedisClient, id: string): Promise<RedisSession | null> {
  const session = await redis.get(getRedisKey(id));
  if (session === null) return null;

  try {
    return RedisSessionRuntime.parse(JSON.parse(session));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Invalid session found in redis", err);
    return null;
  }
}

async function destroyRedisUserSession(redis: RedisClient, id: string) {
  await redis.del(getRedisKey(id));
}

export class SessionStore extends Store {
  constructor(
    private redis: RedisClient,
    public options: Options = {},
  ) {
    super();
  }

  private getTtl(session: SessionData): number {
    if (typeof this.options.ttl === "function") {
      return this.options.ttl(session);
    }
    if (typeof this.options.ttl === "number") {
      return this.options.ttl;
    }

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (session.cookie.expires) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      return new Date(session.cookie.expires).getTime() - Date.now();
    }
    return 24 * 60 * 60 * 1000;
  }

  get serializer(): Serializer {
    return this.options.serializer ?? JSON;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- haha i dont care
  async set(sid: string, session: SessionData, cb = noop) {
    const ttl = this.getTtl(session);
    try {
      if (ttl > 0) {
        await setRedisUserSession(this.redis, { sid, data: session }, millisecondsToSeconds(ttl));
        cb();
      } else {
        await this.destroy(sid, cb);
      }
    } catch (err) {
      cb(err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- haha i dont care
  async get(sid: string, cb = noop) {
    const session = await getRedisUserSession(this.redis, sid);

    if (session === null) {
      cb();
      return;
    }

    try {
      const result = session.data as SessionData;
      cb(undefined, result);
    } catch (err) {
      cb(err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- haha i dont care
  override async touch(sid: string, session: SessionData, cb = noop) {
    const ttl = this.getTtl(session);
    try {
      await setRedisUserSession(this.redis, { sid, data: session }, millisecondsToSeconds(ttl));
      cb();
    } catch (err) {
      cb(err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- haha i dont care
  async destroy(sid: string, cb = noop) {
    try {
      await destroyRedisUserSession(this.redis, sid);
      cb();
    } catch (err) {
      cb(err);
    }
  }
}