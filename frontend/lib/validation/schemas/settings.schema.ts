import { z } from "zod";

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.string(),
  passwordExpiry: z.string(),
  requirePasswordChange: z.boolean(),
  allowMultipleSessions: z.boolean(),
  ipWhitelisting: z.boolean(),
  loginNotifications: z.boolean(),
});

export const sessionSchema = z.object({
  id: z.string(),
  device: z.string(),
  location: z.string(),
  lastActive: z.string(),
  current: z.boolean(),
});

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
});

export const auditorAccessSchema = z.object({
  id: z.string(),
  auditorUserId: z.string(),
  auditorName: z.string(),
  auditorEmail: z.string(),
  grantedBy: z.string(),
  grantedAt: z.string(),
  expiresAt: z.string().optional(),
  isRevoked: z.boolean(),
});

export type AuditorAccess = z.infer<typeof auditorAccessSchema>;

export const availableAuditorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

export type AvailableAuditor = z.infer<typeof availableAuditorSchema>;

export const documentSettingsSchema = z.object({
  encryptionEnabled: z.boolean(),
  autoBackup: z.boolean(),
  compressionEnabled: z.boolean(),
  retentionPeriodDays: z.number().int().min(1),
  allowedFileTypes: z.array(z.string()),
  maxFileSize: z.number().int().min(1),
});

export type DocumentSettings = z.infer<typeof documentSettingsSchema>;

export const encryptionDataSchema = z.object({
  keyVersion: z.number().int().min(1),
  enabledAt: z.string(),
  enabledBy: z.string(),
  organizationId: z.string(),
  encryptionKeyId: z.string(),
  wrappedOrgKey: z.string(),
  salt: z.string(),
  iv: z.string(),
});

export type EncryptionData = z.infer<typeof encryptionDataSchema>;

export const invoiceStyleSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string(),

  // Logo
  logoUrl: z.string().optional(),
  logoPosition: z.enum(["left", "center", "right"]),

  // Colors
  primaryColor: z.string(),
  accentColor: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),

  // Fonts
  headingFont: z.string(),
  bodyFont: z.string(),
  fontSize: z.enum(["small", "medium", "large"]),

  // Layout
  showLogo: z.boolean(),
  showCompanyDetails: z.boolean(),
  showFooter: z.boolean(),
  footerText: z.string(),

  // Labels
  invoiceLabel: z.string(),
  dateLabel: z.string(),
  dueLabel: z.string(),
  billToLabel: z.string(),
  itemLabel: z.string(),
  quantityLabel: z.string(),
  rateLabel: z.string(),
  amountLabel: z.string(),
  totalLabel: z.string(),
});

export type InvoiceStyle = z.infer<typeof invoiceStyleSchema>;
