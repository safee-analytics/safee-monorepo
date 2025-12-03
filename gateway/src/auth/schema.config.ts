/**
 * Schema Configuration for Better Auth
 * Defines additional fields and mappings for user, session, and invitation tables
 */

/**
 * Additional fields in the users table beyond Better Auth defaults
 */
export const userAdditionalFields = {
  role: {
    type: "string" as const,
    required: false,
    defaultValue: "user",
    input: false, // Don't allow users to set their own role
  },
  preferredLocale: {
    type: "string" as const,
    required: false,
    defaultValue: "en",
    input: true,
  },
  isActive: {
    type: "boolean" as const,
    required: false,
    defaultValue: true,
    input: false,
  },
  bio: {
    type: "string" as const,
    required: false,
    input: true,
  },
  timezone: {
    type: "string" as const,
    required: false,
    defaultValue: "UTC",
    input: true,
  },
  dateFormat: {
    type: "string" as const,
    required: false,
    defaultValue: "DD/MM/YYYY",
    input: true,
  },
  deletedAt: {
    type: "date" as const,
    required: false,
    input: false,
  },
};

/**
 * Field mappings for users table
 * Maps Better Auth field names to our database column names
 */
export const userFields = {
  // Better Auth uses camelCase by default, but we use snake_case in DB
  emailVerified: "email_verified",
  twoFactorEnabled: "two_factor_enabled",
  phoneNumber: "phone_number",
  phoneNumberVerified: "phone_number_verified",
  lastLoginMethod: "last_login_method",
  displayUsername: "display_username",
  preferredLocale: "preferred_locale",
  isActive: "is_active",
  banReason: "ban_reason",
  banExpires: "ban_expires",
  dateFormat: "date_format",
  createdAt: "created_at",
  updatedAt: "updated_at",
  deletedAt: "deleted_at",
} as const;

/**
 * Additional fields for invitations table
 */
export const invitationAdditionalFields = {
  teamId: {
    type: "string" as const,
    required: false,
    input: true,
  },
  createdAt: {
    type: "date" as const,
    required: false,
    input: false,
  },
} satisfies Record<
  string,
  { type: "string" | "number" | "boolean" | "date"; required: boolean; input: boolean }
>;

/**
 * Field mappings for invitations table
 */
export const invitationFields = {
  organizationId: "organization_id",
  inviterId: "inviter_id",
  expiresAt: "expires_at",
  teamId: "team_id",
  createdAt: "created_at",
} as const;

/**
 * Session configuration
 */
export const sessionConfig = {
  expiresIn: 60 * 60 * 24 * 7, // 7 days
  updateAge: 60 * 60 * 24, // 1 day
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // 5 minutes
  },
} as const;
