import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Route,
  Tags,
  Security,
  Body,
  Path,
  SuccessResponse,
  Request,
} from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext, type ServerContext } from "../serverContext.js";
import {
  SubscriptionService,
  SubscriptionNotFoundError,
  PlanNotFoundError,
} from "../services/subscription.service.js";
import { Unauthorized, BadRequest, NotFound } from "../errors.js";

interface SubscriptionPlanResponse {
  id: string;
  name: string;
  slug: string;
  pricePerSeat: string;
  maxSeats: number | null;
  billingInterval: string;
  features: Record<string, unknown> | null;
}

interface CreateSubscriptionRequest {
  planId: string;
  seats: number;
}

interface CreateSubscriptionResponse {
  subscriptionId: string;
  planId: string;
  seats: number;
  status: string;
}

interface CurrentSubscriptionResponse {
  hasSubscription: boolean;
  status: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    pricePerSeat: string;
    maxSeats: number | null;
  } | null;
  seats: {
    purchased: number;
    used: number;
    available: number;
    unlimited: boolean;
  } | null;
  isGrandfathered?: boolean;
}

interface UpdateSubscriptionRequest {
  planId?: string;
  seats?: number;
}

interface UpdateSubscriptionResponse {
  subscriptionId: string;
  planId: string;
  seats: number;
  status: string;
}

@Route("subscriptions")
@Tags("Subscriptions")
export class SubscriptionController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }

  /**
   * Get all available subscription plans
   */
  @Get("plans")
  @SuccessResponse("200", "Subscription plans retrieved")
  public async getPlans(): Promise<SubscriptionPlanResponse[]> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);

    try {
      const plans = await service.getPlans();

      return plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        pricePerSeat: plan.pricePerSeat,
        maxSeats: plan.maxSeats,
        billingInterval: plan.billingInterval,
        features: plan.features as Record<string, unknown> | null,
      }));
    } catch (err) {
      this.context.logger.error({ error: err }, "Failed to get subscription plans");
      throw err;
    }
  }

  /**
   * Create a new subscription for the current user
   * Creates subscription as "active" immediately (no payment required)
   */
  @Post("create")
  @Security("jwt")
  @SuccessResponse("201", "Subscription created")
  public async createSubscription(
    @Body() request: CreateSubscriptionRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<CreateSubscriptionResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    // Validate seats is a positive integer
    if (!Number.isInteger(request.seats) || request.seats < 1) {
      throw new BadRequest("Seats must be a positive integer");
    }

    try {
      // Check if user already has a subscription
      const existing = await service.getUserSubscription(userId);
      if (existing) {
        throw new BadRequest("User already has an active subscription");
      }

      // Create subscription
      const subscription = await service.createSubscription({
        userId,
        planId: request.planId,
        seats: request.seats,
      });

      this.setStatus(201);

      return {
        subscriptionId: subscription.id,
        planId: subscription.planId,
        seats: subscription.seatsPurchased,
        status: subscription.status,
      };
    } catch (err) {
      if (err instanceof PlanNotFoundError) {
        throw new NotFound("Subscription plan not found");
      }
      if (err instanceof BadRequest) {
        throw err;
      }
      this.context.logger.error({ error: err, userId }, "Failed to create subscription");
      throw err;
    }
  }

  /**
   * Get the current user's subscription status
   */
  @Get("current")
  @Security("jwt")
  @SuccessResponse("200", "Current subscription retrieved")
  public async getCurrentSubscription(
    @Request() req: AuthenticatedRequest,
  ): Promise<CurrentSubscriptionResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const status = await service.getSubscriptionStatus(userId);

      return {
        hasSubscription: status.hasSubscription,
        status: status.status,
        plan: status.plan
          ? {
              id: status.plan.id,
              name: status.plan.name,
              slug: status.plan.slug,
              pricePerSeat: status.plan.pricePerSeat,
              maxSeats: status.plan.maxSeats,
            }
          : null,
        seats: status.seats,
        isGrandfathered: status.isGrandfathered,
      };
    } catch (err) {
      this.context.logger.error({ error: err, userId }, "Failed to get current subscription");
      throw err;
    }
  }

  /**
   * Update subscription plan or seats
   */
  @Patch("{subscriptionId}")
  @Security("jwt")
  @SuccessResponse("200", "Subscription updated")
  public async updateSubscription(
    @Path() subscriptionId: string,
    @Body() request: UpdateSubscriptionRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<UpdateSubscriptionResponse> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    // Validate seats if provided
    if (request.seats !== undefined && (!Number.isInteger(request.seats) || request.seats < 1)) {
      throw new BadRequest("Seats must be a positive integer");
    }

    try {
      // Verify the subscription belongs to the user
      const existingSubscription = await service.getUserSubscription(userId);
      if (existingSubscription?.id !== subscriptionId) {
        throw new NotFound("Subscription not found");
      }

      const updated = await service.updateSubscription(subscriptionId, request);

      return {
        subscriptionId: updated.id,
        planId: updated.planId,
        seats: updated.seatsPurchased,
        status: updated.status,
      };
    } catch (err) {
      if (err instanceof SubscriptionNotFoundError) {
        throw new NotFound("Subscription not found");
      }
      if (err instanceof PlanNotFoundError) {
        throw new NotFound("Subscription plan not found");
      }
      if (err instanceof NotFound || err instanceof BadRequest) {
        throw err;
      }
      this.context.logger.error({ error: err, userId, subscriptionId }, "Failed to update subscription");
      throw err;
    }
  }

  /**
   * Cancel a subscription
   */
  @Delete("{subscriptionId}")
  @Security("jwt")
  @SuccessResponse("200", "Subscription cancelled")
  public async cancelSubscription(
    @Path() subscriptionId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      // Verify the subscription belongs to the user
      const existingSubscription = await service.getUserSubscription(userId);
      if (existingSubscription?.id !== subscriptionId) {
        throw new NotFound("Subscription not found");
      }

      await service.cancelSubscription(subscriptionId);

      return { message: "Subscription cancelled successfully" };
    } catch (err) {
      if (err instanceof SubscriptionNotFoundError) {
        throw new NotFound("Subscription not found");
      }
      if (err instanceof NotFound) {
        throw err;
      }
      this.context.logger.error({ error: err, userId, subscriptionId }, "Failed to cancel subscription");
      throw err;
    }
  }
}
