import { uuid, boolean, varchar, time, index } from "drizzle-orm/pg-core";
import { identitySchema, idpk } from "./_common.js";
import { users } from "./users.js";

export const notificationSettings = identitySchema.table(
  "notification_settings",
  {
    id: idpk("id"),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull()
      .unique(),

    // Notification Channels
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    smsEnabled: boolean("sms_enabled").default(false).notNull(),
    soundEnabled: boolean("sound_enabled").default(true).notNull(),

    // Notification Types
    auditCaseUpdates: boolean("audit_case_updates").default(true).notNull(),
    documentUploads: boolean("document_uploads").default(true).notNull(),
    taskAssignments: boolean("task_assignments").default(true).notNull(),
    systemAlerts: boolean("system_alerts").default(true).notNull(),
    teamMentions: boolean("team_mentions").default(true).notNull(),
    deadlineReminders: boolean("deadline_reminders").default(true).notNull(),

    // Notification Frequency
    frequency: varchar("frequency", { length: 20 }).default("instant").notNull(), // instant, hourly, daily

    // Quiet Hours
    quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
    quietHoursStart: time("quiet_hours_start"), // e.g., "22:00:00"
    quietHoursEnd: time("quiet_hours_end"), // e.g., "08:00:00"
  },
  (table) => [index("notification_settings_user_id_idx").on(table.userId)],
);
