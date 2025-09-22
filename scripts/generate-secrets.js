#!/usr/bin/env node

/**
 * Generate secure secrets for production deployment
 * Usage: node scripts/generate-secrets.js [--env production|staging]
 */

import { randomBytes } from "crypto";
import { writeFileSync } from "fs";

function generateSecret(length = 32) {
  return randomBytes(length).toString("hex");
}

function generateJwtSecret() {
  return randomBytes(64).toString("base64url");
}

function generateApiKey() {
  return `sk_${randomBytes(16).toString("hex")}`;
}

const environment = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : "staging";

const secrets = {
  JWT_SECRET: generateJwtSecret(),
  COOKIE_KEY: generateSecret(32),
  API_SECRET_KEY: generateApiKey(),
  SESSION_SECRET: generateSecret(32),
  ENCRYPTION_KEY: generateSecret(32),
};

const envContent = Object.entries(secrets)
  .map(([key, value]) => `${key}="${value}"`)
  .join("\n");

const filename = `.env.${environment}.secrets`;

console.log("🔐 Generated secure secrets:");
console.log("=" .repeat(50));

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}: ${value.substring(0, 8)}...${value.substring(value.length - 8)}`);
});

console.log("=" .repeat(50));
console.log(`\n📝 Secrets saved to: ${filename}`);
console.log(`\n⚠️  IMPORTANT: Store these secrets securely!`);
console.log(`   - For Azure: Upload to Key Vault using Azure CLI`);
console.log(`   - For local dev: Copy needed values to .env.local`);
console.log(`   - Never commit this file to version control!`);

writeFileSync(filename, envContent);

console.log(`\n🚀 To upload to Azure Key Vault:`);
console.log(`   az keyvault secret set --vault-name "safee-${environment}-kv" --name "jwt-secret" --value "${secrets.JWT_SECRET}"`);
console.log(`   az keyvault secret set --vault-name "safee-${environment}-kv" --name "cookie-key" --value "${secrets.COOKIE_KEY}"`);
console.log(`   az keyvault secret set --vault-name "safee-${environment}-kv" --name "api-secret-key" --value "${secrets.API_SECRET_KEY}"`);