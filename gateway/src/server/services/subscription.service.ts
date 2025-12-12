import {
  type DbDeps,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  getSubscriptionPlanBySlug,
  createSubscription,
  getSubscriptionByUserId,
  getSubscriptionByOrgId,
  updateSubscription,
  linkSubscriptionToOrg,
  cancelSubscription,
  hasActiveSubscription,
  getSeatUsage,
  canInviteMember,
  markExistingOrgsAsGrandfathered,
  type CreateSubscriptionData,
  type UpdateSubscriptionData,
  SubscriptionNotFoundError,
  PlanNotFoundError,
} from "@safee/database";

/**
 * Service for managing subscriptions and billing
 * Handles subscription creation, upgrades, seat management, and grandfathering
 */
export class SubscriptionService {
  constructor(private readonly deps: DbDeps) {}

  /**
   * Get all available subscription plans
   */
  async getPlans() {
    return getSubscriptionPlans(this.deps);
  }

  /**
   * Get a specific plan by ID
   */
  async getPlanById(planId: string) {
    return getSubscriptionPlanById(this.deps, planId);
  }

  /**
   * Get a specific plan by slug (e.g., 'starter', 'professional')
   */
  async getPlanBySlug(slug: string) {
    return getSubscriptionPlanBySlug(this.deps, slug);
  }

  /**
   * Create a new subscription for a user
   * Creates subscription as "active" immediately (no payment required for now)
   */
  async createSubscription(data: CreateSubscriptionData) {
    return createSubscription(this.deps, data);
  }

  /**
   * Get subscription for a specific user
   */
  async getUserSubscription(userId: string) {
    return getSubscriptionByUserId(this.deps, userId);
  }

  /**
   * Get subscription for an organization
   */
  async getOrgSubscription(organizationId: string) {
    return getSubscriptionByOrgId(this.deps, organizationId);
  }

  /**
   * Update an existing subscription
   * Can change plan, seats, or status
   */
  async updateSubscription(subscriptionId: string, data: UpdateSubscriptionData) {
    return updateSubscription(this.deps, subscriptionId, data);
  }

  /**
   * Link a subscription to an organization after org creation
   * Called in the afterCreateOrganization hook
   */
  async linkToOrganization(userId: string, organizationId: string) {
    return linkSubscriptionToOrg(this.deps, userId, organizationId);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    return cancelSubscription(this.deps, subscriptionId);
  }

  /**
   * Check if user has an active subscription
   * Used to gate organization creation
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    return hasActiveSubscription(this.deps, userId);
  }

  /**
   * Get seat usage for an organization
   * Returns purchased, used, and available seats
   */
  async getSeatUsage(organizationId: string) {
    return getSeatUsage(this.deps, organizationId);
  }

  /**
   * Check if organization can invite more members
   * Validates seat availability and grandfathered status
   */
  async canInviteMember(organizationId: string): Promise<boolean> {
    return canInviteMember(this.deps, organizationId);
  }

  /**
   * Mark all existing organizations as grandfathered
   * Should be run once during subscription rollout
   */
  async markExistingOrgsAsGrandfathered() {
    return markExistingOrgsAsGrandfathered(this.deps);
  }

  /**
   * Upgrade subscription to a new plan
   * Validates seat limits against new plan
   */
  async upgradeSubscription(subscriptionId: string, newPlanId: string, seats?: number) {
    const subscription = await this.getOrgSubscription(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError();
    }

    return this.updateSubscription(subscriptionId, {
      planId: newPlanId,
      ...(seats && { seats }),
    });
  }

  /**
   * Add seats to an existing subscription
   */
  async addSeats(subscriptionId: string, additionalSeats: number) {
    const subscription = await this.deps.drizzle.query.organizationSubscriptions.findFirst({
      where: (subs, { eq }) => eq(subs.id, subscriptionId),
    });

    if (!subscription) {
      throw new SubscriptionNotFoundError();
    }

    const newSeatCount = subscription.seatsPurchased + additionalSeats;

    return this.updateSubscription(subscriptionId, {
      seats: newSeatCount,
    });
  }

  /**
   * Get subscription status for display
   */
  async getSubscriptionStatus(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return {
        hasSubscription: false,
        status: null,
        plan: null,
        seats: null,
      };
    }

    const usage = subscription.organization ? await this.getSeatUsage(subscription.organization.id) : null;

    return {
      hasSubscription: true,
      status: subscription.status,
      plan: subscription.plan,
      seats: usage,
      isGrandfathered: subscription.isGrandfathered,
    };
  }
}

// Export error classes for use in controllers
export { SubscriptionNotFoundError, PlanNotFoundError };
