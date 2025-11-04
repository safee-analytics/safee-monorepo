import { eq } from "drizzle-orm";
import { users, organizations } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Locale } from "../drizzle/_common.js";

export interface CreateUserData {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  // Password removed - Better Auth handles passwords in oauth_accounts table
}

export interface CreateUserWithOrgData {
  email: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
  // Password removed - Better Auth handles passwords in oauth_accounts table
}

export interface UserWithOrganization {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  // passwordHash removed - Better Auth handles passwords in oauth_accounts table
  organizationId: string;
  preferredLocale: Locale;
  isActive: boolean;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  preferredLocale?: Locale;
}

export async function createUser(deps: DbDeps, userData: CreateUserData): Promise<typeof users.$inferSelect> {
  const { drizzle, logger } = deps;

  try {
    const existingUser = await getUserByEmail(deps, userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const [newUser] = await drizzle
      .insert(users)
      .values({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationId: userData.organizationId,
      })
      .returning();

    logger.info({ userId: newUser.id, email: userData.email }, "User created successfully");

    return newUser;
  } catch (err) {
    logger.error({ error: err, email: userData.email }, "Failed to create user");
    throw err;
  }
}

export async function createUserWithOrganization(
  deps: DbDeps,
  userData: CreateUserWithOrgData,
): Promise<{ user: typeof users.$inferSelect; organization: typeof organizations.$inferSelect }> {
  const { drizzle, logger } = deps;

  try {
    const existingUser = await getUserByEmail(deps, userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const slug = generateSlug(userData.organizationName);

    const existingOrg = await drizzle
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (existingOrg.length > 0) {
      throw new Error("Organization with this name already exists");
    }

    const result = await drizzle.transaction(async (tx) => {
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: userData.organizationName,
          slug,
        })
        .returning();

      const [newUser] = await tx
        .insert(users)
        .values({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationId: newOrg.id,
        })
        .returning();

      return { user: newUser, organization: newOrg };
    });

    logger.info(
      {
        userId: result.user.id,
        organizationId: result.organization.id,
        email: userData.email,
      },
      "User and organization created successfully",
    );

    return result;
  } catch (err) {
    logger.error({ error: err, email: userData.email }, "Failed to create user with organization");
    throw err;
  }
}

export async function getUserByEmail(deps: DbDeps, email: string): Promise<UserWithOrganization | null> {
  const { drizzle, logger } = deps;

  try {
    const result = await drizzle
      .select({
        user: users,
        organization: organizations,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.email, email))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { user, organization } = result[0];

    return {
      ...user,
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }
        : undefined,
    };
  } catch (err) {
    logger.error({ error: err, email }, "Failed to get user by email");
    throw err;
  }
}

export async function getUserById(deps: DbDeps, id: string): Promise<UserWithOrganization | null> {
  const { drizzle, logger } = deps;

  try {
    const result = await drizzle
      .select({
        user: users,
        organization: organizations,
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const { user, organization } = result[0];

    return {
      ...user,
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }
        : undefined,
    };
  } catch (err) {
    logger.error({ error: err, userId: id }, "Failed to get user by ID");
    throw err;
  }
}

export async function updateUserProfile(
  deps: DbDeps,
  userId: string,
  updateData: UpdateUserProfileData,
): Promise<typeof users.$inferSelect> {
  const { drizzle, logger } = deps;

  try {
    const existingUser = await getUserById(deps, userId);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const [updatedUser] = await drizzle
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    logger.info({ userId, updateData }, "User profile updated successfully");

    return updatedUser;
  } catch (err) {
    logger.error({ error: err, userId }, "Failed to update user profile");
    throw err;
  }
}

export async function updateUserLocale(deps: DbDeps, userId: string, locale: Locale): Promise<void> {
  const { drizzle, logger } = deps;

  try {
    await drizzle
      .update(users)
      .set({
        preferredLocale: locale,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    logger.info({ userId, locale }, "User locale updated successfully");
  } catch (err) {
    logger.error({ error: err, userId, locale }, "Failed to update user locale");
    throw err;
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, 50);
}
