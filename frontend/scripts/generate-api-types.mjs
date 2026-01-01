#!/usr/bin/env node
/* eslint-disable no-console */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SWAGGER_PATH = path.join(__dirname, "../../gateway/src/server/swagger.json");
const OUTPUT_DIR = path.join(__dirname, "../lib/api/types");
const TEMP_DIR = path.join(__dirname, "../.temp-types");

// Module groupings - combine related tags into logical modules
const MODULE_GROUPS = {
  accounting: ["Accounting"],
  audit: ["Cases", "Audit Planning", "Audit Logs"],
  reports: ["Reports"],
  collaboration: ["Collaboration"],
  crm: ["CRM"],
  hr: ["HR & Payroll", "HR Management"],
  workflows: ["Workflows", "Approvals"],
  storage: ["Storage", "NAS Management"],
  integrations: ["Integrations", "Odoo", "Connectors"],
  settings: [
    "Settings",
    "Security",
    "Database",
    "Organizations",
    "Subscriptions",
    "Onboarding",
    "Module Access",
  ],
  users: ["Users"],
  dashboard: ["Dashboard"],
  ocr: ["OCR"],
  health: ["Health"],
};

console.log("🔧 Generating modular API types...\n");

// Read the full swagger spec
const swaggerSpec = JSON.parse(fs.readFileSync(SWAGGER_PATH, "utf-8"));

// Create output directories
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

// Helper to filter paths by tags
function filterPathsByTags(spec, tags) {
  const filtered = {
    ...spec,
    paths: {},
  };

  for (const [path, methods] of Object.entries(spec.paths)) {
    const filteredMethods = {};
    let hasMatch = false;

    for (const [method, operation] of Object.entries(methods)) {
      if (method === "parameters") continue;

      const operationTags = operation.tags || [];
      if (operationTags.some((tag) => tags.includes(tag))) {
        filteredMethods[method] = operation;
        hasMatch = true;
      }
    }

    if (hasMatch) {
      filtered.paths[path] = filteredMethods;
    }
  }

  return filtered;
}

// Generate types for each module
const indexExports = [];

for (const [moduleName, tags] of Object.entries(MODULE_GROUPS)) {
  console.log(`📦 Generating types for ${moduleName} module (${tags.join(", ")})...`);

  // Filter spec for this module
  const moduleSpec = filterPathsByTags(swaggerSpec, tags);

  // Skip if no paths for this module
  if (Object.keys(moduleSpec.paths).length === 0) {
    console.log(`   ⚠️  No paths found for ${moduleName}, skipping...\n`);
    continue;
  }

  // Write filtered spec to temp file
  const tempSpecPath = path.join(TEMP_DIR, `${moduleName}-spec.json`);
  fs.writeFileSync(tempSpecPath, JSON.stringify(moduleSpec, null, 2));

  // Generate types using openapi-typescript
  const outputPath = path.join(OUTPUT_DIR, `${moduleName}.ts`);
  try {
    // Use JSON.stringify to safely quote paths for shell execution
    const safeSpecPath = JSON.stringify(tempSpecPath);
    const safeOutputPath = JSON.stringify(outputPath);
    execSync(`npx openapi-typescript ${safeSpecPath} -o ${safeOutputPath}`, { stdio: "inherit" });
    console.log(`   ✅ Generated ${moduleName}.ts\n`);

    // Add to index exports
    indexExports.push(`export * from './${moduleName}.js';`);
  } catch (error) {
    console.error(`   ❌ Failed to generate ${moduleName}.ts:`, error.message);
  }
}

// Generate index file with namespaced exports
const namespacedExports = Object.keys(MODULE_GROUPS)
  .filter((module) => indexExports.some((exp) => exp.includes(module)))
  .map((module) => {
    const capitalizedName = module.charAt(0).toUpperCase() + module.slice(1);
    return `export * as ${capitalizedName} from './${module}.js';`;
  });

const indexContent = `/**
 * Auto-generated API types
 * Generated from OpenAPI spec
 *
 * Import specific modules (namespaced):
 * import { Accounting } from '@/lib/api/types'
 * type MyPaths = Accounting.paths
 *
 * Or import directly:
 * import type { paths } from '@/lib/api/types/accounting'
 */

${namespacedExports.join("\n")}

// Re-export the unified paths type for backward compatibility
export type { paths } from './paths.js';
`;

fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), indexContent);
console.log("📄 Generated index.ts with namespaced exports");

// Generate a unified paths type that combines all modules
const unifiedPathsContent = `/**
 * Unified paths type combining all API modules
 */

${Object.keys(MODULE_GROUPS)
  .map(
    (module) =>
      `import type { paths as ${module.charAt(0).toUpperCase() + module.slice(1)}Paths } from './${module}.js';`,
  )
  .join("\n")}

export type paths =
${Object.keys(MODULE_GROUPS)
  .map(
    (module, idx, arr) =>
      `  ${module.charAt(0).toUpperCase() + module.slice(1)}Paths${idx < arr.length - 1 ? " &" : ";"}`,
  )
  .join("\n")}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, "paths.ts"), unifiedPathsContent);
console.log("📄 Generated unified paths.ts");

// Clean up temp directory
fs.rmSync(TEMP_DIR, { recursive: true });

console.log("\n✨ Type generation complete!");
console.log(`📁 Output directory: ${OUTPUT_DIR}`);
console.log(`📊 Generated ${indexExports.length} module files`);
