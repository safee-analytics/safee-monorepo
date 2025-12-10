import { ENV } from "../env.js";

export interface SecurityConfig {
  enableHelmet: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  cookieSecure: boolean;
  cookieSameSite: "strict" | "lax" | "none";
  csrfProtection: boolean;
}

export interface StorageConfig {
  useCloudStorage: boolean;
  provider: "azure" | "gcp" | "local";
  bucket: string;
  uploadPath: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  // Chunked upload configuration
  chunkSize: number;
  chunkThreshold: number;
  chunkUploadExpiry: number; // in seconds
  tempUploadPath: string;
  maxChunkSize: number;
  concurrentChunkUploads: number;
}

export interface DatabaseConfig {
  url: string;
  connectionLimit: number;
  sslMode: boolean;
  poolTimeout: number;
}

export interface LoggingConfig {
  level: string;
  sqlLevel: string;
  enableRequestLogging: boolean;
  enableQueryLogging: boolean;
}

export interface AuthConfig {
  enableAuthentication: boolean;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  bcryptRounds: number;
  enablePasswordValidation: boolean;
}

export function getSecurityConfig(): SecurityConfig {
  const isProduction = ENV === "production";

  return {
    enableHelmet: process.env.ENABLE_HELMET?.toLowerCase() === "true" || isProduction,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || (isProduction ? 900000 : 60000), // 15min prod, 1min dev
    rateLimitMaxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || (isProduction ? 100 : 1000),
    cookieSecure: isProduction,
    cookieSameSite: isProduction ? "strict" : "lax",
    csrfProtection: isProduction,
  };
}

export function getStorageConfig(): StorageConfig {
  const useCloud = process.env.USE_CLOUD_STORAGE?.toLowerCase() === "true";

  return {
    useCloudStorage: useCloud,
    provider: useCloud ? (process.env.STORAGE_PROVIDER as "azure" | "gcp") || "azure" : "local",
    bucket: process.env.FILE_UPLOAD_BUCKET || "dev-safee-storage",
    uploadPath: process.env.FILE_UPLOAD_PATH || "uploads",
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB default (increased from 10MB)
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    // Chunked upload configuration
    chunkSize: Number(process.env.CHUNK_SIZE) || 5 * 1024 * 1024, // 5MB chunks
    chunkThreshold: Number(process.env.CHUNK_THRESHOLD) || 10 * 1024 * 1024, // Files > 10MB use chunking
    chunkUploadExpiry: Number(process.env.CHUNK_UPLOAD_EXPIRY) || 86400, // 24 hours in seconds
    tempUploadPath: process.env.TEMP_UPLOAD_PATH || "./storage/temp",
    maxChunkSize: Number(process.env.MAX_CHUNK_SIZE) || 10 * 1024 * 1024, // 10MB max per chunk
    concurrentChunkUploads: Number(process.env.CONCURRENT_CHUNK_UPLOADS) || 3, // 3 parallel uploads
  };
}

export function getDatabaseConfig(): DatabaseConfig {
  const isProduction = ENV === "production";

  return {
    url: process.env.DATABASE_URL || "",
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT) || (isProduction ? 20 : 5),
    sslMode: isProduction,
    poolTimeout: Number(process.env.DATABASE_POOL_TIMEOUT) || 30000, // 30 seconds
  };
}

export function getLoggingConfig(): LoggingConfig {
  const isProduction = ENV === "production";
  const isDevelopment = ENV === "local" || ENV === "development";

  return {
    level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    sqlLevel: process.env.SQL_LOG_LEVEL || (isProduction ? "warn" : "info"),
    enableRequestLogging: !isProduction || process.env.ENABLE_REQUEST_LOGGING?.toLowerCase() === "true",
    enableQueryLogging: isDevelopment || process.env.ENABLE_QUERY_LOGGING?.toLowerCase() === "true",
  };
}

export function getAuthConfig(): AuthConfig {
  const isProduction = ENV === "production";

  return {
    enableAuthentication: true, // Always enabled - authentication required for all environments
    jwtSecret: process.env.JWT_SECRET || "dev-secret-key-please-change-in-production",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || (isProduction ? 12 : 8),
    enablePasswordValidation: process.env.ENABLE_PASSWORD_VALIDATION?.toLowerCase() !== "false",
  };
}

export function validateEnvironmentConfig(): void {
  const authConfig = getAuthConfig();
  const required = ["DATABASE_URL"];

  // Only require JWT_SECRET if authentication is enabled
  if (authConfig.enableAuthentication) {
    required.push("JWT_SECRET");
  }

  const production = [
    "AZURE_STORAGE_ACCOUNT_NAME",
    "AZURE_STORAGE_ACCOUNT_KEY",
    "APPLICATION_INSIGHTS_CONNECTION_STRING",
    "CORS_ORIGIN",
  ];

  const missing: string[] = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (ENV === "production") {
    for (const varName of production) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (authConfig.enableAuthentication && process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
}
