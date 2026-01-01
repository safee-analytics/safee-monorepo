export const ALL_MODULES = ["accounting", "hr", "crm", "audit"] as const;

export type ModuleKey = (typeof ALL_MODULES)[number];
