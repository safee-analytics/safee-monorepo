import { rule as logFormat } from "./rules/log-format.js";
import { rule as drizzle } from "./rules/drizzle.js";
import { rule as tsoaSecurity } from "./rules/security.js";
import { recommended } from "./configs/recommended.js";

const plugin = {
  rules: {
    "log-format": logFormat,
    drizzle,
    "tsoa-security": tsoaSecurity,
  },
  configs: {},
};

Object.assign(plugin.configs, { recommended: recommended(plugin) });

export default plugin;
