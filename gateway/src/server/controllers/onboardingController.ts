import { Controller, Get, Post, Route, Tags, Security, Request, Body, SuccessResponse } from "tsoa";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getServerContext, type ServerContext } from "../serverContext.js";
import { SubscriptionService } from "../services/subscription.service.js";
import { Unauthorized } from "../errors.js";

interface OnboardingStatus {
  currentStep: "accept-invitation" | "select-plan" | "create-organization" | "completed";
  hasSubscription: boolean;
  hasOrganization: boolean;
  hasPendingInvitations: boolean;
  pendingInvitationsCount: number;
  subscription: {
    planName: string;
    planSlug: string;
    seats: number;
    isFree: boolean;
  } | null;
  nextAction: {
    title: string;
    description: string;
    ctaText: string;
    ctaRoute: string;
  };
}

interface UpgradePlanRequest {
  planId: string;
  seats: number;
}

@Route("onboarding")
@Tags("Onboarding")
export class OnboardingController extends Controller {
  private context: ServerContext;

  constructor(context?: ServerContext) {
    super();
    this.context = context ?? getServerContext();
  }

  /**
   * Get current onboarding status and next step for the user
   */
  @Get("status")
  @Security("jwt")
  @SuccessResponse("200", "Onboarding status retrieved")
  public async getOnboardingStatus(@Request() req: AuthenticatedRequest): Promise<OnboardingStatus> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;
    const activeOrgId = req.betterAuthSession?.session.activeOrganizationId;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      const userEmail = req.betterAuthSession?.user.email;

      // Check for pending invitations
      const pendingInvitations = await this.context.drizzle.query.invitations.findMany({
        where: (invitations, { and, eq }) =>
          and(eq(invitations.email, userEmail!), eq(invitations.status, "pending")),
      });
      const hasPendingInvitations = pendingInvitations.length > 0;

      // Check subscription status
      const subscriptionStatus = await service.getSubscriptionStatus(userId);
      const hasSubscription = subscriptionStatus.hasSubscription;

      // Verify organization actually exists in database, not just in session
      let hasOrganization = false;
      if (activeOrgId) {
        const org = await this.context.drizzle.query.organizations.findFirst({
          where: (orgs, { eq }) => eq(orgs.id, activeOrgId),
        });
        hasOrganization = !!org;

        // If session has org ID but org doesn't exist, clear it
        if (!org) {
          this.context.logger.warn(
            { userId, activeOrgId },
            "Session has activeOrganizationId but organization doesn't exist, should clear session",
          );
        }
      }

      // Determine current step and next action
      let currentStep: OnboardingStatus["currentStep"];
      let nextAction: OnboardingStatus["nextAction"];

      // Priority 1: If user has pending invitations and no org, show invitation acceptance
      if (hasPendingInvitations && !hasOrganization) {
        currentStep = "accept-invitation";
        nextAction = {
          title: `You have ${pendingInvitations.length} pending ${pendingInvitations.length === 1 ? "invitation" : "invitations"}`,
          description: "Accept an invitation to join an existing organization, or create your own",
          ctaText: "View Invitations",
          ctaRoute: "/onboarding/invitations",
        };
      } else if (!hasSubscription) {
        // Should never happen with auto-free subscription, but handle it
        currentStep = "select-plan";
        nextAction = {
          title: "Choose Your Plan",
          description: "Select a subscription plan to get started with Safee Analytics",
          ctaText: "View Plans",
          ctaRoute: "/onboarding/select-plan",
        };
      } else if (!hasOrganization) {
        // Has subscription but no organization
        const isFree = subscriptionStatus.plan?.slug === "free";
        if (isFree) {
          currentStep = "select-plan";
          nextAction = {
            title: "You're on the Free Plan",
            description: "Start with 1 seat for free, or upgrade now for more features and team members",
            ctaText: "Continue with Free",
            ctaRoute: "/onboarding/create-organization",
          };
        } else {
          currentStep = "create-organization";
          nextAction = {
            title: "Create Your Organization",
            description: "Set up your organization to start using Safee Analytics",
            ctaText: "Create Organization",
            ctaRoute: "/onboarding/create-organization",
          };
        }
      } else {
        // Has both subscription and organization - onboarding complete
        currentStep = "completed";
        nextAction = {
          title: "Welcome to Safee Analytics",
          description: "Your account is all set up. Start exploring!",
          ctaText: "Go to Dashboard",
          ctaRoute: "/dashboard",
        };
      }

      return {
        currentStep,
        hasSubscription,
        hasOrganization,
        hasPendingInvitations,
        pendingInvitationsCount: pendingInvitations.length,
        subscription: subscriptionStatus.plan
          ? {
              planName: subscriptionStatus.plan.name,
              planSlug: subscriptionStatus.plan.slug,
              seats: subscriptionStatus.seats?.purchased ?? 1,
              isFree: subscriptionStatus.plan.slug === "free",
            }
          : null,
        nextAction,
      };
    } catch (err) {
      this.context.logger.error({ error: err, userId }, "Failed to get onboarding status");
      throw err;
    }
  }

  /**
   * Upgrade from free plan to paid plan during onboarding
   */
  @Post("upgrade-plan")
  @Security("jwt")
  @SuccessResponse("200", "Plan upgraded successfully")
  public async upgradePlan(
    @Body() request: UpgradePlanRequest,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string; planName: string }> {
    const deps = { drizzle: this.context.drizzle, logger: this.context.logger };
    const service = new SubscriptionService(deps);
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    try {
      // Get current subscription
      const currentSubscription = await service.getUserSubscription(userId);

      if (!currentSubscription) {
        // No subscription - create new one
        await service.createSubscription({
          userId,
          planId: request.planId,
          seats: request.seats,
        });

        const plan = await service.getPlanById(request.planId);
        return {
          message: "Subscription created successfully",
          planName: plan?.name ?? "Unknown",
        };
      }

      // Update existing subscription
      await service.updateSubscription(currentSubscription.id, {
        planId: request.planId,
        seats: request.seats,
      });

      const plan = await service.getPlanById(request.planId);

      this.context.logger.info(
        { userId, oldPlan: currentSubscription.plan.slug, newPlanId: request.planId },
        "User upgraded subscription during onboarding",
      );

      return {
        message: "Plan upgraded successfully",
        planName: plan?.name ?? "Unknown",
      };
    } catch (err) {
      this.context.logger.error({ error: err, userId }, "Failed to upgrade plan during onboarding");
      throw err;
    }
  }

  /**
   * Skip upgrade and continue with free plan
   */
  @Post("skip-upgrade")
  @Security("jwt")
  @SuccessResponse("200", "Continuing with free plan")
  public async skipUpgrade(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string; nextStep: string }> {
    const userId = req.betterAuthSession?.user.id;

    if (!userId) {
      throw new Unauthorized("User not authenticated");
    }

    this.context.logger.info({ userId }, "User chose to skip upgrade and continue with free plan");

    return {
      message: "Continuing with free plan",
      nextStep: "create-organization",
    };
  }
}
