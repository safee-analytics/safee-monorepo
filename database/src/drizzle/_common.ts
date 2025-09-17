import { pgSchema, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export function idpk(name: string) {
  return uuid(name)
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull();
}

export const gateway = pgSchema("gateway");
export const memory = pgSchema("memory");
export const items = pgSchema("items");
export const recipeCraft = pgSchema("recipe_craft");
export const images = pgSchema("images");
export const creativeWorks = pgSchema("creative_works");
export const behaviour = pgSchema("behaviour");
export const pushNotifications = pgSchema("push_notifications");
export const challenges = pgSchema("challenges");
export const chat = pgSchema("chat");
export const combat = pgSchema("combat");
