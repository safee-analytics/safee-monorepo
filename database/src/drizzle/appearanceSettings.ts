import { uuid, boolean, varchar, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

export const appearanceSettings = identitySchema.table(
  "appearance_settings",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull()
      .unique(),

    // Theme
    theme: varchar("theme", { length: 20 }).default("light").notNull(), // light, dark, auto

    // Color Scheme
    colorScheme: varchar("color_scheme", { length: 20 }).default("blue").notNull(), // blue, purple, green, orange, red, teal

    // Font Size
    fontSize: varchar("font_size", { length: 20 }).default("medium").notNull(), // small, medium, large

    // Display Density
    density: varchar("density", { length: 20 }).default("comfortable").notNull(), // compact, comfortable, spacious

    // Accessibility
    animationsEnabled: boolean("animations_enabled").default(true).notNull(),
    reducedMotion: boolean("reduced_motion").default(false).notNull(),
  },
  (table) => [index("appearance_settings_user_id_idx").on(table.userId)],
);
