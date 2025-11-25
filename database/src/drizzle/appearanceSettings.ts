import { uuid, boolean, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk, themeEnum, colorSchemeEnum, fontSizeEnum, densityEnum } from "./_common.js";
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
    theme: themeEnum("theme").default("light").notNull(),

    // Color Scheme
    colorScheme: colorSchemeEnum("color_scheme").default("blue").notNull(),

    // Font Size
    fontSize: fontSizeEnum("font_size").default("medium").notNull(),

    // Display Density
    density: densityEnum("density").default("comfortable").notNull(),

    // Accessibility
    animationsEnabled: boolean("animations_enabled").default(true).notNull(),
    reducedMotion: boolean("reduced_motion").default(false).notNull(),
  },
  (table) => [index("appearance_settings_user_id_idx").on(table.userId)],
);
