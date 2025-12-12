/* eslint-disable no-console */
import { connect } from "../drizzle.js";
import { subscriptionPlans, organizationSubscriptions } from "../drizzle/index.js";
import { eq } from "drizzle-orm";

// Subscription plans configuration
const defaultPlans = [
  {
    name: "Free",
    slug: "free",
    pricePerSeat: "0.00",
    maxSeats: 1,
    billingInterval: "monthly",
    features: {
      modules: ["accounting", "hr", "crm"],
      storage: "5GB",
      support: "community",
      reporting: "basic",
    },
    stripePriceId: null,
  },
  {
    name: "Starter",
    slug: "starter",
    pricePerSeat: "10.00",
    maxSeats: 10,
    billingInterval: "monthly",
    features: {
      modules: ["accounting", "hr", "crm"],
      storage: "10GB",
      support: "email",
      reporting: "basic",
    },
    stripePriceId: null, // To be added when Stripe integration is implemented
  },
  {
    name: "Professional",
    slug: "professional",
    pricePerSeat: "20.00",
    maxSeats: null, // Unlimited seats
    billingInterval: "monthly",
    features: {
      modules: ["accounting", "hr", "crm", "advanced-analytics"],
      storage: "unlimited",
      support: "priority",
      reporting: "advanced",
      apiAccess: true,
      customFields: true,
    },
    stripePriceId: null, // To be added when Stripe integration is implemented
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    pricePerSeat: "50.00",
    maxSeats: null, // Unlimited seats
    billingInterval: "monthly",
    features: {
      modules: ["accounting", "hr", "crm", "advanced-analytics", "custom-modules"],
      storage: "unlimited",
      support: "dedicated",
      reporting: "custom",
      apiAccess: true,
      customFields: true,
      sso: true,
      auditLogs: true,
      dedicatedInstance: true,
    },
    stripePriceId: null, // To be added when Stripe integration is implemented
  },
];

async function seedSubscriptionPlans() {
  const { drizzle, close } = connect("seed-subscription-plans");

  try {
    console.log("🌱 Seeding subscription plans...");

    for (const plan of defaultPlans) {
      const existing = await drizzle.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.slug, plan.slug),
      });

      if (!existing) {
        await drizzle.insert(subscriptionPlans).values(plan);
        console.log(`✅ Created subscription plan: ${plan.name} ($${plan.pricePerSeat}/seat/month)`);
      } else {
        console.log(`⏭️  Subscription plan already exists: ${plan.name}`);
      }
    }

    console.log("\n🌱 Marking existing organizations as grandfathered...");

    // Mark all existing active organization subscriptions as grandfathered
    const result = await drizzle
      .update(organizationSubscriptions)
      .set({ isGrandfathered: true })
      .where(eq(organizationSubscriptions.status, "active"))
      .returning();

    if (result.length > 0) {
      console.log(`✅ Marked ${result.length} existing organization(s) as grandfathered`);
    } else {
      console.log("⏭️  No existing organizations to grandfather");
    }

    console.log("🎉 Subscription plan seeding completed!");
  } catch (err) {
    console.error("❌ Error seeding subscription plans:", err);
    process.exit(1);
  } finally {
    await close();
  }
}

void seedSubscriptionPlans();
