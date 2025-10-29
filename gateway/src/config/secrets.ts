import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import { ENV } from "../env.js";

interface SecretCache {
  [key: string]: {
    value: string;
    expiry: number;
  };
}

export class SecretsManager {
  private client?: SecretClient;
  private cache: SecretCache = {};
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (ENV === "production" && process.env.AZURE_KEY_VAULT_URL) {
      try {
        const credential = new DefaultAzureCredential();
        this.client = new SecretClient(process.env.AZURE_KEY_VAULT_URL, credential);
      } catch (error) {
        // eslint-disable-next-line no-console -- Acceptable for Azure Key Vault initialization errors
        console.warn("Failed to initialize Azure Key Vault client:", error);
      }
    }
  }

  async getSecret(name: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache[name];
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    let value: string | null = null;

    if (this.client) {
      try {
        const secret = await this.client.getSecret(name);
        value = secret.value || null;
      } catch (error) {
        // eslint-disable-next-line no-console -- Acceptable for secret retrieval errors
        console.warn(`Failed to retrieve secret "${name}" from Key Vault:`, error);
      }
    }

    if (!value) {
      value = process.env[name.toUpperCase()] || null;
    }

    if (value) {
      this.cache[name] = {
        value,
        expiry: Date.now() + this.cacheTTL,
      };
    }

    return value;
  }

  async getSecrets(names: string[]): Promise<Record<string, string | null>> {
    const results = await Promise.all(names.map((name) => this.getSecret(name)));
    const secrets: Record<string, string | null> = {};

    for (let i = 0; i < names.length; i++) {
      secrets[names[i]] = results[i];
    }

    return secrets;
  }

  clearCache(): void {
    this.cache = {};
  }

  async getDatabaseUrl(): Promise<string> {
    const baseUrl = await this.getSecret("database-url");
    if (!baseUrl) {
      throw new Error("DATABASE_URL secret not found");
    }
    return baseUrl;
  }

  async getJwtSecret(): Promise<string> {
    const secret = await this.getSecret("jwt-secret");
    if (!secret) {
      throw new Error("JWT_SECRET not found");
    }

    if (secret.length < 32) {
      throw new Error("JWT secret must be at least 32 characters long");
    }

    return secret;
  }

  async getStorageCredentials(): Promise<{ accountName: string; accountKey: string } | null> {
    const [accountName, accountKey] = await Promise.all([
      this.getSecret("azure-storage-account-name"),
      this.getSecret("azure-storage-account-key"),
    ]);

    if (!accountName || !accountKey) {
      return null;
    }

    return { accountName, accountKey };
  }
}

export const secretsManager = new SecretsManager();

export async function initializeSecrets(): Promise<void> {
  const requiredSecrets = ["jwt-secret"];

  if (ENV === "production") {
    requiredSecrets.push("database-url", "azure-storage-account-name", "azure-storage-account-key");
  }

  const secrets = await secretsManager.getSecrets(requiredSecrets);
  const missing = requiredSecrets.filter((name) => !secrets[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }

  // eslint-disable-next-line no-console -- Acceptable for initialization success logging
  console.log("✅ Secrets manager initialized successfully");
}
