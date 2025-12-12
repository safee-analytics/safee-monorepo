import { varchar, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { systemSchema, idpk } from "./_common.js";

export const subscriptionPlans = systemSchema.table("subscription_plans", {
  id: idpk("id"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  pricePerSeat: numeric("price_per_seat", { precision: 10, scale: 2 }).notNull(),
  maxSeats: integer("max_seats"), // null = unlimited
  billingInterval: varchar("billing_interval", { length: 20 }).notNull().default("monthly"),
  features: jsonb("features"),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});
