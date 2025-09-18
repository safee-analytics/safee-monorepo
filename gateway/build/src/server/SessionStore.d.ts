import type { RedisClient } from "@safee/database";
import { SessionData, Store } from "express-session";
import { z } from "zod";
declare function noop(_err?: unknown, _session?: SessionData): void;
type Serializer = {
    stringify: (t: unknown) => string;
    parse: (data: string) => unknown;
};
type Options = {
    ttl?: number | ((session: SessionData) => number);
    serializer?: Serializer;
};
export declare const RedisSessionRuntime: z.ZodObject<{
    data: z.ZodUnknown;
    sid: z.ZodString;
}, z.core.$strip>;
export declare const SessionPrefixKey: string;
export declare class SessionStore extends Store {
    private redis;
    options: Options;
    constructor(redis: RedisClient, options?: Options);
    private getTtl;
    get serializer(): Serializer;
    set(sid: string, session: SessionData, cb?: typeof noop): Promise<void>;
    get(sid: string, cb?: typeof noop): Promise<void>;
    touch(sid: string, session: SessionData, cb?: typeof noop): Promise<void>;
    destroy(sid: string, cb?: typeof noop): Promise<void>;
}
export {};
