import { millisecondsToSeconds } from "date-fns";
import { Store } from "express-session";
import { z } from "zod";
function noop(_err, _session) {
    /* empty */
}
export const RedisSessionRuntime = z.object({
    data: z.unknown(),
    sid: z.string(),
});
// NOTE: Changing this env var will invalidate EVERY existing session, this is just for an oh shit button
export const SessionPrefixKey = process.env.SESSION_PREFIX_KEY ?? "";
function getRedisKey(id, prefixKey = SessionPrefixKey) {
    return `user-session-${prefixKey}${id}`;
}
async function setRedisUserSession(redis, sessionData, timeToLiveSeconds) {
    await redis.set(getRedisKey(sessionData.sid), JSON.stringify(sessionData), { EX: timeToLiveSeconds });
}
async function getRedisUserSession(redis, id) {
    const session = await redis.get(getRedisKey(id));
    if (session === null)
        return null;
    try {
        return RedisSessionRuntime.parse(JSON.parse(session));
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("Invalid session found in redis", err);
        return null;
    }
}
async function destroyRedisUserSession(redis, id) {
    await redis.del(getRedisKey(id));
}
export class SessionStore extends Store {
    redis;
    options;
    constructor(redis, options = {}) {
        super();
        this.redis = redis;
        this.options = options;
    }
    getTtl(session) {
        if (typeof this.options.ttl === "function") {
            return this.options.ttl(session);
        }
        if (typeof this.options.ttl === "number") {
            return this.options.ttl;
        }
        if (session.cookie.expires) {
            return new Date(session.cookie.expires).getTime() - Date.now();
        }
        return 24 * 60 * 60 * 1000;
    }
    get serializer() {
        return this.options.serializer ?? JSON;
    }
    async set(sid, session, cb = noop) {
        const ttl = this.getTtl(session);
        try {
            if (ttl > 0) {
                await setRedisUserSession(this.redis, { sid, data: session }, millisecondsToSeconds(ttl));
                cb();
            }
            else {
                await this.destroy(sid, cb);
            }
        }
        catch (err) {
            cb(err);
        }
    }
    async get(sid, cb = noop) {
        const session = await getRedisUserSession(this.redis, sid);
        if (session === null) {
            cb();
            return;
        }
        try {
            const result = session.data;
            cb(undefined, result);
        }
        catch (err) {
            cb(err);
        }
    }
    async touch(sid, session, cb = noop) {
        const ttl = this.getTtl(session);
        try {
            await setRedisUserSession(this.redis, { sid, data: session }, millisecondsToSeconds(ttl));
            cb();
        }
        catch (err) {
            cb(err);
        }
    }
    async destroy(sid, cb = noop) {
        try {
            await destroyRedisUserSession(this.redis, sid);
            cb();
        }
        catch (err) {
            cb(err);
        }
    }
}
