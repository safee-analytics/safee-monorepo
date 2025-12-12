/* eslint-disable no-console */
import { connect } from "../drizzle.js";
import { autoCreateFreeSubscription } from "../subscriptions/subscriptions.js";
import { pino } from "pino";

const logger = pino({ name: "create-free-subscriptions" });

/**
 * Create free subscriptions for all existing users who don't have one
 * Run this after implementing the subscription feature to ensure all users have subscriptions
 */
async function createFreeSubscriptionsForExistingUsers() {
  const { drizzle, close } = connect("create-free-subscriptions");

  try {
    console.log("🌱 Creating free subscriptions for existing users...");

    // Get all users
    const users = await drizzle.query.users.findMany();
    console.log(`Found ${users.length} users`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const subscription = await autoCreateFreeSubscription({ drizzle, logger }, user.id);

        if (subscription) {
          created++;
          console.log(`✅ Created free subscription for user: ${user.email}`);
        }
      } catch (err) {
        // User already has a subscription, skip
        if (err instanceof Error && err.message.includes("already has")) {
          skipped++;
          console.log(`⏭️  User already has subscription: ${user.email}`);
        } else {
          console.error(`❌ Error creating subscription for user ${user.email}:`, err);
        }
      }
    }

    console.log(`\n🎉 Completed!`);
    console.log(`   Created: ${created} subscriptions`);
    console.log(`   Skipped: ${skipped} users (already have subscriptions)`);
  } catch (err) {
    console.error("❌ Error creating free subscriptions:", err);
    process.exit(1);
  } finally {
    await close();
  }
}

void createFreeSubscriptionsForExistingUsers();
