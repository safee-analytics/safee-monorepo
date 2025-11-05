import type { OrganizationOptions } from "better-auth/plugins/organization";
import { logger } from "../server/utils/logger.js";
import { odooDatabaseService } from "../server/services/odoo/database.service.js";
import { odooUserProvisioningService } from "../server/services/odoo/user-provisioning.service.js";

/**
 * Organization lifecycle hooks for Better Auth
 * Handles Odoo provisioning and cleanup
 */
export const organizationHooks: OrganizationOptions["organizationHooks"] = {
  // Provision Odoo database and admin user when organization is created
  afterCreateOrganization: async ({ organization, member, user }) => {
    logger.info(
      { organizationId: organization.id, userId: user.id },
      "Organization created, provisioning Odoo",
    );

    setImmediate(async () => {
      try {
        // Check if Odoo database already exists (idempotent provisioning)
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

        // Provision Odoo user for organization creator
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

  // Provision Odoo user when member is added (via invitation)
  afterAddMember: async ({ member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id, role: member.role },
      "Member added to organization, provisioning Odoo user",
    );

    setImmediate(async () => {
      try {
        const userExists = await odooUserProvisioningService.userExists(user.id, organization.id);

        if (userExists) {
          logger.info({ userId: user.id }, "Odoo user already exists for new member");
        } else {
          await odooUserProvisioningService.provisionUser(user.id, organization.id, member.role);
          logger.info({ userId: user.id }, "Odoo user provisioned for new member");
        }
      } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to provision Odoo user for new member");
      }
    });
  },

  // Deactivate Odoo user when member is removed from organization
  afterRemoveMember: async ({ member: _member, user, organization }) => {
    logger.info(
      { userId: user.id, organizationId: organization.id },
      "Member removed, deactivating Odoo user",
    );

    setImmediate(async () => {
      try {
        await odooUserProvisioningService.deactivateUser(user.id, organization.id);
        logger.info({ userId: user.id }, "Odoo user deactivated");
      } catch (error) {
        logger.error({ error, userId: user.id }, "Failed to deactivate Odoo user");
      }
    });
  },

  // Delete Odoo database when organization is deleted
  afterDeleteOrganization: async ({ organization }) => {
    logger.info({ organizationId: organization.id }, "Organization deleted, cleaning up Odoo database");

    setImmediate(async () => {
      try {
        await odooDatabaseService.deleteDatabase(organization.id);
        logger.info({ organizationId: organization.id }, "Odoo database deleted successfully");
      } catch (error) {
        logger.error({ error, organizationId: organization.id }, "Failed to delete Odoo database");
      }
    });
  },
};
