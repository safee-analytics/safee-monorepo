import type { OrganizationOptions } from "better-auth/plugins/organization";
import { logger } from "../server/utils/logger.js";
import { canManageRole } from "./accessControl.js";
import { connect, createEmployee, schema, odoo, redisConnect } from "@safee/database";
import { getServerContext } from "../server/serverContext.js";
import { eq } from "drizzle-orm";
import { SubscriptionService } from "../server/services/subscription.service.js";
import { ODOO_URL, ODOO_PORT, ODOO_ADMIN_PASSWORD, JWT_SECRET } from "../env.js";

const { drizzle } = connect("better-auth");

let odooDatabaseService: odoo.OdooDatabaseService | undefined;
let odooUserProvisioningService: odoo.OdooUserProvisioningService | undefined;

async function getServices() {
  if (!odooDatabaseService) {
    const ctx = getServerContext();
    const redis = await redisConnect();
    odooDatabaseService = new odoo.OdooDatabaseService({
      logger: ctx.logger,
      drizzle: ctx.drizzle,
      redis,
      odooClient: new odoo.OdooClient(ODOO_URL),
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooConfig: {
        url: ODOO_URL,
        port: ODOO_PORT,
        adminPassword: ODOO_ADMIN_PASSWORD,
      },
    });
    odooUserProvisioningService = new odoo.OdooUserProvisioningService({
      drizzle,
      logger,
      encryptionService: new odoo.EncryptionService(JWT_SECRET),
      odooUrl: ODOO_URL,
    });
  }
  return { odooDatabaseService, odooUserProvisioningService };
}

export const organizationHooks: OrganizationOptions["organizationHooks"] = {
  beforeCreateOrganization: async ({ organization, user }) => {
    logger.info({ userId: user.id }, "Validating organization creation - checking subscription");

    const subscriptionService = new SubscriptionService({ drizzle, logger });

    try {
      // Check if user has an active subscription
      const hasSubscription = await subscriptionService.hasActiveSubscription(user.id);

      if (!hasSubscription) {
        logger.warn({ userId: user.id }, "User attempted to create organization without active subscription");
        throw new Error("Please select a subscription plan to create an organization");
      }

      logger.info({ userId: user.id }, "Subscription validation passed for organization creation");

      return { data: organization };
    } catch (err) {
      logger.error(
        { error: err, userId: user.id },
        "Failed to validate subscription for organization creation",
      );
      throw err;
    }
  },

  beforeUpdateMemberRole: async ({ member: targetMember, newRole, user, organization }) => {
    logger.info(
      {
        currentUserId: user.id,
        targetUserId: targetMember.userId,
        targetCurrentRole: targetMember.role,
        newRole,
        organizationId: organization.id,
      },
      "Validating role update",
    );

    const currentMember = await drizzle.query.members.findFirst({
      where: (members, { and, eq }) =>
        and(eq(members.organizationId, organization.id), eq(members.userId, user.id)),
    });

    if (!currentMember) {
      logger.warn({ currentUserId: user.id }, "User attempting role update is not a member");
      throw new Error("You are not a member of this organization");
    }

    if (user.id === targetMember.userId) {
      logger.warn({ userId: user.id }, "User attempting to change own role");
      throw new Error("Cannot change your own role");
    }

    if (!canManageRole(currentMember.role, targetMember.role)) {
      logger.warn(
        {
          currentUserRole: currentMember.role,
          targetUserRole: targetMember.role,
        },
        "Insufficient permissions to manage target user",
      );
      throw new Error("You do not have permission to manage this user");
    }

    if (!canManageRole(currentMember.role, newRole)) {
      logger.warn(
        {
          currentUserRole: currentMember.role,
          attemptedNewRole: newRole,
        },
        "Insufficient permissions to assign this role",
      );
      throw new Error("You do not have permission to assign this role");
    }

    logger.info({ targetUserId: targetMember.userId, newRole }, "Role update validation passed");
  },

  beforeRemoveMember: async ({ member: targetMember, user, organization }) => {
    logger.info(
      {
        currentUserId: user.id,
        targetUserId: targetMember.userId,
        targetUserRole: targetMember.role,
        organizationId: organization.id,
      },
      "Validating member removal",
    );

    const currentMember = await drizzle.query.members.findFirst({
      where: (members, { and, eq }) =>
        and(eq(members.organizationId, organization.id), eq(members.userId, user.id)),
    });

    if (!currentMember) {
      logger.warn({ currentUserId: user.id }, "User attempting removal is not a member");
      throw new Error("You are not a member of this organization");
    }

    if (user.id === targetMember.userId) {
      logger.warn({ userId: user.id }, "User attempting to remove themselves");
      throw new Error("Cannot remove yourself. Use leave organization instead");
    }

    if (!canManageRole(currentMember.role, targetMember.role)) {
      logger.warn(
        {
          currentUserRole: currentMember.role,
          targetUserRole: targetMember.role,
        },
        "Insufficient permissions to remove target user",
      );
      throw new Error("You do not have permission to remove this user");
    }

    logger.info({ targetUserId: targetMember.userId }, "Member removal validation passed");
  },

  beforeCreateInvitation: async ({ invitation, inviter, organization }) => {
    const invitedRole = invitation.role;

    logger.info(
      {
        inviterId: inviter.id,
        invitedRole,
        organizationId: organization.id,
      },
      "Validating invitation creation",
    );

    const inviterMember = await drizzle.query.members.findFirst({
      where: (members, { and, eq }) =>
        and(eq(members.organizationId, organization.id), eq(members.userId, inviter.id)),
    });

    if (!inviterMember) {
      logger.warn({ inviterId: inviter.id }, "Inviter is not a member of organization");
      throw new Error("You are not a member of this organization");
    }

    if (!canManageRole(inviterMember.role, invitedRole)) {
      logger.warn(
        {
          inviterRole: inviterMember.role,
          attemptedInviteRole: invitedRole,
        },
        "Insufficient permissions to invite with this role",
      );
      throw new Error("You do not have permission to invite members with this role");
    }

    // Check seat availability
    const subscriptionService = new SubscriptionService({ drizzle, logger });

    try {
      const canInvite = await subscriptionService.canInviteMember(organization.id);

      if (!canInvite) {
        const seatUsage = await subscriptionService.getSeatUsage(organization.id);
        logger.warn(
          {
            organizationId: organization.id,
            seatsUsed: seatUsage.used,
            seatsPurchased: seatUsage.purchased,
          },
          "Organization has no available seats for new member",
        );
        throw new Error(
          `Cannot invite member. Organization has used all ${seatUsage.purchased} seats. Please upgrade your subscription to add more members.`,
        );
      }

      logger.info({ invitedRole, organizationId: organization.id }, "Invitation validation passed");

      return { data: invitation };
    } catch (err) {
      logger.error({ error: err, organizationId: organization.id }, "Failed to validate seat availability");
      throw err;
    }
  },
  afterCreateOrganization: async ({ organization, member, user }) => {
    logger.info(
      { organizationId: organization.id, userId: user.id },
      "Organization created, updating session, linking subscription, and provisioning Odoo",
    );

    // Update the session with the new active organization ID
    try {
      const sessions = await drizzle.query.sessions.findMany({
        where: (sessions, { eq }) => eq(sessions.userId, user.id),
      });

      if (sessions.length > 0) {
        // Update all active sessions for this user
        await drizzle
          .update(schema.sessions)
          .set({ activeOrganizationId: organization.id })
          .where(eq(schema.sessions.userId, user.id));

        logger.info(
          { userId: user.id, organizationId: organization.id },
          "Updated session with active organization ID",
        );
      }
    } catch (err) {
      logger.error(
        { error: err, userId: user.id, organizationId: organization.id },
        "Failed to update session with active organization",
      );
    }

    // Link the subscription to the organization
    try {
      const subscriptionService = new SubscriptionService({ drizzle, logger });
      await subscriptionService.linkToOrganization(user.id, organization.id);
      logger.info(
        { userId: user.id, organizationId: organization.id },
        "Linked subscription to organization",
      );
    } catch (err) {
      logger.error(
        { error: err, userId: user.id, organizationId: organization.id },
        "Failed to link subscription to organization",
      );
    }

    setImmediate(() => {
      void (async () => {
        try {
          const { odooDatabaseService, odooUserProvisioningService } = await getServices();
          const existingCreds = await odooDatabaseService.getCredentials(organization.id);

          if (existingCreds) {
            logger.info(
              { organizationId: organization.id },
              "Odoo database already provisioned, skipping database creation",
            );
          } else {
            logger.info({ organizationId: organization.id }, "Provisioning Odoo database");
            await odooDatabaseService.provisionDatabase(organization.id);
            logger.info({ organizationId: organization.id }, "Odoo database provisioned");
          }

          if (odooUserProvisioningService) {
            const userExists = await odooUserProvisioningService.userExists(user.id, organization.id);

            if (userExists) {
              logger.info(
                { userId: user.id, organizationId: organization.id },
                "Odoo user already provisioned, skipping user creation",
              );
            } else {
              logger.info({ userId: user.id, organizationId: organization.id }, "Provisioning Odoo user");
              await odooUserProvisioningService.provisionUser(user.id, organization.id, member.role);
              logger.info({ userId: user.id }, "Odoo user provisioned");
            }
          }

          // Configure Odoo webhooks for the organization
          logger.info({ organizationId: organization.id }, "Configuring Odoo webhooks");
          await odoo.configureOdooWebhooks(logger, user.id, organization.id);
          logger.info({ organizationId: organization.id }, "Odoo webhooks configured");
        } catch (err) {
          logger.error(
            { error: err, userId: user.id, organizationId: organization.id },
            "Failed to provision Odoo resources",
          );
        }
      })();
    });
  },

  afterAddMember: async ({ member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id, role: member.role },
      "Member added to organization, provisioning Odoo user and creating employee record",
    );

    setImmediate(() => {
      void (async () => {
        try {
          const { odooUserProvisioningService } = await getServices();

          if (odooUserProvisioningService) {
            const userExists = await odooUserProvisioningService.userExists(user.id, organization.id);

            if (userExists) {
              logger.info({ userId: user.id }, "Odoo user already exists for new member");
            } else {
              await odooUserProvisioningService.provisionUser(user.id, organization.id, member.role);
              logger.info({ userId: user.id }, "Odoo user provisioned for new member");
            }
          }

          const existingEmployee = await drizzle.query.hrEmployees.findFirst({
            where: (employees, { eq }) => eq(employees.userId, user.id),
          });

          if (!existingEmployee) {
            logger.info({ userId: user.id }, "Creating employee record for new member");
            await createEmployee(
              { drizzle, logger },
              {
                organizationId: organization.id,
                userId: user.id,
                name: user.name,
                workEmail: user.email,
                active: true,
              },
            );
            logger.info({ userId: user.id }, "Employee record created for new member");
          } else {
            logger.info({ userId: user.id }, "Employee record already exists for user");
          }
        } catch (err) {
          logger.error(
            { error: err, userId: user.id },
            "Failed to provision Odoo user or create employee for new member",
          );
        }
      })();
    });
  },

  afterRemoveMember: async ({ member: _member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id },
      "Member removed, deactivating Odoo user",
    );

    setImmediate(() => {
      void (async () => {
        try {
          const { odooUserProvisioningService } = await getServices();

          if (odooUserProvisioningService) {
            await odooUserProvisioningService.deactivateUser(user.id, organization.id);
            logger.info({ userId: user.id }, "Odoo user deactivated");
          }
        } catch (err) {
          logger.error({ error: err, userId: user.id }, "Failed to deactivate Odoo user");
        }
      })();
    });
  },

  afterDeleteOrganization: async ({ organization }) => {
    logger.info(
      { organizationId: organization.id },
      "Organization deleted, cleaning up Odoo database and sessions",
    );

    // Clear activeOrganizationId from all sessions that had this org active
    try {
      await drizzle
        .update(schema.sessions)
        .set({ activeOrganizationId: null })
        .where(eq(schema.sessions.activeOrganizationId, organization.id));

      logger.info(
        { organizationId: organization.id },
        "Cleared activeOrganizationId from sessions for deleted organization",
      );
    } catch (err) {
      logger.error(
        { error: err, organizationId: organization.id },
        "Failed to clear activeOrganizationId from sessions",
      );
    }

    setImmediate(() => {
      void (async () => {
        try {
          const { odooDatabaseService } = await getServices();
          await odooDatabaseService.deleteDatabase(organization.id);
          logger.info({ organizationId: organization.id }, "Odoo database deleted successfully");
        } catch (err) {
          logger.error({ error: err, organizationId: organization.id }, "Failed to delete Odoo database");
        }
      })();
    });
  },
};
