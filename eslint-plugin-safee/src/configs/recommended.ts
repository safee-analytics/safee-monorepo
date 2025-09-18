export function recommended(plugin: unknown) {
  return {
    plugins: { safee: plugin },
    rules: {
      "safee/log-format": [
        "warn",
        {
          loggerNames: ["logger"],
          logMethods: ["silent", "fatal", "error", "warn", "info", "debug", "trace"],
        },
      ],
      "safee/drizzle": [
        "warn",
        {
          drizzleNames: ["drizzle"],
        },
      ],
      "safee/tsoa-security": ["warn"],
    },
  };
}
