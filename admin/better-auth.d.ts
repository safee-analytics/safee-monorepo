/**
 * Type augmentation for Better Auth
 * Extends Better Auth types with custom user fields
 */

import "better-auth/types";

declare module "better-auth/types" {
  interface User {
    role: string;
    organizationId?: string;
    isActive?: boolean;
    banned?: boolean;
  }
}
