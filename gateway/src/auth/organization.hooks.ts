import type { OrganizationOptions } from "better-auth/plugins/organization";
import { logger } from "../server/utils/logger.js";
import { OdooDatabaseService } from "../server/services/odoo/database.service.js";
import { OdooUserProvisioningService } from "../server/services/odoo/user-provisioning.service.js";
import { canManageRole } from "./accessControl.js";
import { connect, createEmployee } from "@safee/database";
import { getServerContext } from "../server/serverContext.js";

const { drizzle } = connect("better-auth");

let odooDatabaseService: OdooDatabaseService;
let odooUserProvisioningService: OdooUserProvisioningService;

function getServices() {
  if (!odooDatabaseService) {
    const ctx = getServerContext();
    odooDatabaseService = new OdooDatabaseService(ctx);
    odooUserProvisioningService = new OdooUserProvisioningService(drizzle);
  }
  return { odooDatabaseService, odooUserProvisioningService };
}

export const organizationHooks: OrganizationOptions["organizationHooks"] = {
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

    logger.info({ invitedRole }, "Invitation validation passed");

    return { data: invitation };
  },
  afterCreateOrganization: async ({ organization, member, user }) => {
    logger.info(
      { organizationId: organization.id, userId: user.id },
      "Organization created, provisioning Odoo",
    );

    setImmediate(async () => {
      try {
        const { odooDatabaseService, odooUserProvisioningService } = getServices();
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
      } catch (error) {
        logger.error(
          { error, userId: user.id, organizationId: organization.id },
          "Failed to provision Odoo resources",
        );
      }
    });
  },

  afterAddMember: async ({ member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id, role: member.role },
      "Member added to organization, provisioning Odoo user and creating employee record",
    );

    setImmediate(async () => {
      try {
        const { odooUserProvisioningService } = getServices();
        const userExists = await odooUserProvisioningService.userExists(user.id, organization.id);

        if (userExists) {
          logger.info({ userId: user.id }, "Odoo user already exists for new member");
        } else {
          await odooUserProvisioningService.provisionUser(user.id, organization.id, member.role);
          logger.info({ userId: user.id }, "Odoo user provisioned for new member");
        }

        // Auto-create employee record for new member
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
      } catch (error) {
        logger.error(
          { error, userId: user.id },
          "Failed to provision Odoo user or create employee for new member",
        );
      }
    });
  },

  afterRemoveMember: async ({ member: _member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id },
      "Member removed, deactivating Odoo user",
    );

    setImmediate(async () => {
      try {
        const { odooUserProvisioningService } = getServices();
        await odooUserProvisioningService.deactivateUser(user.id, organization.id);
        logger.info({ userId: user.id }, "Odoo user deactivated");
      } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to deactivate Odoo user");
      }
    });
  },

  afterDeleteOrganization: async ({ organization }) => {
    logger.info({ organizationId: organization.id }, "Organization deleted, cleaning up Odoo database");

    setImmediate(async () => {
      try {
        const { odooDatabaseService } = getServices();
        await odooDatabaseService.deleteDatabase(organization.id);
        logger.info({ organizationId: organization.id }, "Odoo database deleted successfully");
      } catch (error) {
        logger.error({ error, organizationId: organization.id }, "Failed to delete Odoo database");
      }
    });
  },
};
