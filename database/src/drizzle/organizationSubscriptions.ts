import { varchar, timestamp, integer, boolean, uuid } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";

export const organizationSubscriptions = systemSchema.table("organization_subscriptions", {
  id: idpk("id"),
  organizationId: uuid("organization_id"), // Nullable - set after org creation
  userId: uuid("user_id").notNull(),
  planId: uuid("plan_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  seatsPurchased: integer("seats_purchased").notNull().default(1),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  isGrandfathered: boolean("is_grandfathered").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
