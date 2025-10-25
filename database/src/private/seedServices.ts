/* eslint-disable no-console */
import { connect } from "../drizzle.js";
import { services } from "../drizzle/index.js";
import { eq } from "drizzle-orm";

// Starting with accounting only - other services will be added as we build them
const defaultServices = [
  {
    name: "account",
    displayName: "Accounting",
    description: "Financial accounting and invoicing",
    serviceType: "accounting" as const,
    icon: "calculator",
    sortOrder: "10",
  },
];

async function seedServices() {
  const { drizzle, close } = connect("seed-services");

  try {
    console.log("🌱 Seeding default services...");

    for (const service of defaultServices) {
      const existing = await drizzle.query.services.findFirst({
        where: eq(services.name, service.name),
      });

      if (!existing) {
        await drizzle.insert(services).values(service);
        console.log(`✅ Created service: ${service.displayName}`);
      } else {
        console.log(`⏭️  Service already exists: ${service.displayName}`);
      }
    }

    console.log("🎉 Service seeding completed!");
  } catch (err) {
    console.error("❌ Error seeding services:", err);
    process.exit(1);
  } finally {
    await close();
  }
}

void seedServices();
