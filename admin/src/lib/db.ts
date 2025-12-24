import { connect } from "@safee/database";

// Singleton database connection
let dbInstance: ReturnType<typeof connect> | null = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = connect("admin-dashboard");
  }
  return dbInstance;
}

export function getDbClient() {
  return getDb().drizzle;
}
