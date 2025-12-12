import { eq, and, isNull } from "drizzle-orm";
import { organizationSubscriptions } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";

export class SubscriptionNotFoundError extends Error {
  constructor(message = "Subscription not found") {
    super(message);
    this.name = "SubscriptionNotFoundError";
  }
}

export class PlanNotFoundError extends Error {
  constructor(message = "Plan not found") {
    super(message);
    this.name = "PlanNotFoundError";
  }
}

export interface CreateSubscriptionData {
  userId: string;
  organizationId?: string; // Optional - might be set after org creation
  planId: string;
  seats: number;
}

export interface UpdateSubscriptionData {
  planId?: string;
  seats?: number;
  status?: string;
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(deps: DbDeps) {
  const { drizzle } = deps;
  return await drizzle.query.subscriptionPlans.findMany({
    orderBy: (plans, { asc }) => [asc(plans.pricePerSeat)],
  });
}

/**
 * Get a subscription plan by ID
 */
export async function getSubscriptionPlanById(deps: DbDeps, planId: string) {
  const { drizzle } = deps;
  return await drizzle.query.subscriptionPlans.findFirst({
    where: (plans, { eq }) => eq(plans.id, planId),
  });
}

/**
 * Get a subscription plan by slug
 */
export async function getSubscriptionPlanBySlug(deps: DbDeps, slug: string) {
  const { drizzle } = deps;
  return await drizzle.query.subscriptionPlans.findFirst({
    where: (plans, { eq }) => eq(plans.slug, slug),
  });
}

/**
 * Create a new subscription
 */
export async function createSubscription(deps: DbDeps, data: CreateSubscriptionData) {
  const { drizzle, logger } = deps;

  // Verify plan exists
  const plan = await getSubscriptionPlanById(deps, data.planId);
  if (!plan) {
    throw new PlanNotFoundError(`Plan ${data.planId} not found`);
  }

  // Validate seats against plan limits
  if (plan.maxSeats && data.seats > plan.maxSeats) {
    throw new Error(
      `Cannot purchase ${data.seats} seats. Plan ${plan.name} has a maximum of ${plan.maxSeats} seats`,
    );
  }

  const [subscription] = await drizzle
    .insert(organizationSubscriptions)
    .values({
      userId: data.userId,
      organizationId: data.organizationId ?? null,
      planId: data.planId,
      seatsPurchased: data.seats,
      status: "active",
      isGrandfathered: false,
    })
    .returning();

  logger.info({ subscriptionId: subscription.id, userId: data.userId }, "Subscription created");

  return subscription;
}

/**
 * Get subscription for a user
 */
export async function getSubscriptionByUserId(deps: DbDeps, userId: string) {
  const { drizzle } = deps;
  return await drizzle.query.organizationSubscriptions.findFirst({
    where: (subs, { eq }) => eq(subs.userId, userId),
    with: {
      plan: true,
      organization: true,
    },
  });
}

/**
 * Get subscription for an organization
 */
export async function getSubscriptionByOrgId(deps: DbDeps, organizationId: string) {
  const { drizzle } = deps;
  return await drizzle.query.organizationSubscriptions.findFirst({
    where: (subs, { eq }) => eq(subs.organizationId, organizationId),
    with: {
      plan: true,
    },
  });
}

/**
 * Update a subscription
 */
export async function updateSubscription(deps: DbDeps, subscriptionId: string, data: UpdateSubscriptionData) {
  const { drizzle, logger } = deps;

  // If changing plan, verify it exists
  if (data.planId) {
    const plan = await getSubscriptionPlanById(deps, data.planId);
    if (!plan) {
      throw new PlanNotFoundError(`Plan ${data.planId} not found`);
    }

    // Validate seats against new plan limits
    if (plan.maxSeats && data.seats && data.seats > plan.maxSeats) {
      throw new Error(
        `Cannot purchase ${data.seats} seats. Plan ${plan.name} has a maximum of ${plan.maxSeats} seats`,
      );
    }
  }

  const [updated] = await drizzle
    .update(organizationSubscriptions)
    .set({
      ...(data.planId && { planId: data.planId }),
      ...(data.seats && { seatsPurchased: data.seats }),
      ...(data.status && { status: data.status }),
    })
    .where(eq(organizationSubscriptions.id, subscriptionId))
    .returning();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!updated) {
    throw new SubscriptionNotFoundError();
  }

  logger.info({ subscriptionId }, "Subscription updated");

  return updated;
}

/**
 * Link subscription to organization (called after org creation)
 */
export async function linkSubscriptionToOrg(deps: DbDeps, userId: string, organizationId: string) {
  const { drizzle, logger } = deps;

  const [updated] = await drizzle
    .update(organizationSubscriptions)
    .set({ organizationId })
    .where(
      and(eq(organizationSubscriptions.userId, userId), isNull(organizationSubscriptions.organizationId)),
    )
    .returning();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!updated) {
    logger.warn({ userId, organizationId }, "No subscription found to link to organization");
    return null;
  }

  logger.info({ subscriptionId: updated.id, organizationId }, "Subscription linked to organization");

  return updated;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(deps: DbDeps, subscriptionId: string) {
  const { drizzle, logger } = deps;

  const [cancelled] = await drizzle
    .update(organizationSubscriptions)
    .set({ status: "canceled" })
    .where(eq(organizationSubscriptions.id, subscriptionId))
    .returning();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!cancelled) {
    throw new SubscriptionNotFoundError();
  }

  logger.info({ subscriptionId }, "Subscription cancelled");

  return cancelled;
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(deps: DbDeps, userId: string): Promise<boolean> {
  const { drizzle } = deps;

  const subscription = await drizzle.query.organizationSubscriptions.findFirst({
    where: (subs, { and, eq }) => and(eq(subs.userId, userId), eq(subs.status, "active")),
  });

  return !!subscription;
}

/**
 * Get seat usage for an organization
 */
export async function getSeatUsage(deps: DbDeps, organizationId: string) {
  const { drizzle } = deps;

  const subscription = await getSubscriptionByOrgId(deps, organizationId);
  if (!subscription) {
    return { purchased: 0, used: 0, available: 0, unlimited: false };
  }

  // Count active members in the organization
  const activeMembers = await drizzle.query.members.findMany({
    where: (m, { eq }) => eq(m.organizationId, organizationId),
  });

  const used = activeMembers.length;
  const purchased = subscription.seatsPurchased;
  const available = purchased - used;

  return {
    purchased,
    used,
    available,
    unlimited: subscription.plan.maxSeats === null,
  };
}

/**
 * Check if organization can invite more members
 */
export async function canInviteMember(deps: DbDeps, organizationId: string): Promise<boolean> {
  const subscription = await getSubscriptionByOrgId(deps, organizationId);
  if (!subscription) {
    // No subscription - check if grandfathered
    return false;
  }

  // Grandfathered orgs have unlimited seats
  if (subscription.isGrandfathered) {
    return true;
  }

  // Check seat availability
  const usage = await getSeatUsage(deps, organizationId);

  // Unlimited seats
  if (usage.unlimited) {
    return true;
  }

  // Has available seats
  return usage.available > 0;
}

/**
 * Mark existing organizations as grandfathered
 */
export async function markExistingOrgsAsGrandfathered(deps: DbDeps) {
  const { drizzle, logger } = deps;

  const result = await drizzle
    .update(organizationSubscriptions)
    .set({ isGrandfathered: true })
    .where(eq(organizationSubscriptions.status, "active"))
    .returning();

  logger.info({ count: result.length }, "Marked existing organizations as grandfathered");

  return result;
}

/**
 * Auto-create free subscription for new users
 * Called during signup to ensure all users have a default subscription
 */
export async function autoCreateFreeSubscription(deps: DbDeps, userId: string) {
  const { logger } = deps;

  // Check if user already has a subscription
  const existing = await getSubscriptionByUserId(deps, userId);
  if (existing) {
    logger.info({ userId }, "User already has a subscription, skipping auto-creation");
    return existing;
  }

  // Get the free plan
  const freePlan = await getSubscriptionPlanBySlug(deps, "free");
  if (!freePlan) {
    logger.warn("Free plan not found, cannot auto-create subscription");
    throw new PlanNotFoundError("Free plan not found in database");
  }

  // Create free subscription
  logger.info({ userId, planId: freePlan.id }, "Auto-creating free subscription for new user");

  return createSubscription(deps, {
    userId,
    planId: freePlan.id,
    seats: 1,
  });
}
