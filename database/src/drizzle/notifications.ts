import { uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { systemSchema, idpk, notificationTypeEnum, relatedEntityTypeEnum } from "./_common.js";
import { users } from "./users.js";
import { organizations } from "./organizations.js";

export const notifications = systemSchema.table(
  "notifications",
  {
    id: idpk("id"),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" })
      .notNull(),

    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),

    // Optional related entity references
    relatedEntityType: relatedEntityTypeEnum("related_entity_type"),
    relatedEntityId: uuid("related_entity_id"),

    // Action button for notification
    actionLabel: varchar("action_label", { length: 100 }), // e.g., "View Case", "Review Now", "View Document"
    actionUrl: varchar("action_url", { length: 500 }), // e.g., "/audit/cases/123"

    // Status
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_org_id_idx").on(table.organizationId),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_is_read_idx").on(table.isRead),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
