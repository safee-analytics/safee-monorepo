import pg from "pg";
import { drizzle as createDrizzle } from "drizzle-orm/node-postgres";
import * as schema from "./drizzle/index.js";
import { Column, SQL, sql } from "drizzle-orm";

export * from "drizzle-orm";
export { alias, getTableConfig, type PgUpdateSetSource, type PgInsertValue } from "drizzle-orm/pg-core";
export { schema };

export const DatabaseError = pg.DatabaseError;

export function connect(appName: string, database_url?: string) {
  const pool = new pg.Pool({
    connectionString: database_url ?? process.env.DATABASE_URL,
    max: 10,
    allowExitOnIdle: true,
    statement_timeout: 20_000,
    query_timeout: 20_000,
    application_name: appName,
    idle_in_transaction_session_timeout: 20_000,
  });

  const drizzle = createDrizzle({
    client: pool,
    schema,
    casing: "snake_case",
  });

  return { drizzle, close: () => pool.end(), pool };
}

export type DrizzleClient = Omit<Awaited<ReturnType<typeof connect>>["drizzle"], "$client">;

export function coalesce<T>(...elements: (SQL | Column)[]) {
  return sql<T>`COALESCE(${sql.join(elements, sql.raw(", "))})`;
}

export function now(): SQL<Date> {
  return sql`now()`.mapWith((d: string) => new Date(d));
}

export function addDays(value: SQL | Column, days: number): SQL<Date> {
  const intervalString = `${Math.abs(days)} days`;
  return days < 0
    ? sql`${value} - ${intervalString}::interval`.mapWith((d: string) => new Date(d))
    : sql`${value} + ${intervalString}::interval`.mapWith((d: string) => new Date(d));
}
