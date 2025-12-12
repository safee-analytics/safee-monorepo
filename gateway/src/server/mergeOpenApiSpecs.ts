import type { OpenAPIV3 } from "openapi-types";

export function mergeBetterAuthSpec(
  tsoaSpec: OpenAPIV3.Document,
  betterAuthSpec: OpenAPIV3.Document,
): OpenAPIV3.Document {
  const servers: OpenAPIV3.ServerObject[] = [
    {
      url: "/api/v1",
      description: "Safee API",
    },
  ];

  const authPaths: OpenAPIV3.PathsObject = {};
  for (const [path, pathItem] of Object.entries(betterAuthSpec.paths)) {
    // No /auth prefix - Better Auth is mounted directly at /api/v1/
    const updatedPathItem: OpenAPIV3.PathItemObject = { ...pathItem };

    for (const method of ["get", "post", "put", "delete", "patch", "options"] as const) {
      if (updatedPathItem[method]) {
        const operation = updatedPathItem[method];
        const updatedOperation: OpenAPIV3.OperationObject = {
          ...operation,
          tags: ["Authentication"],
        };
        updatedPathItem[method] = updatedOperation;
      }
    }

    authPaths[path] = updatedPathItem;
  }

  return {
    ...tsoaSpec,
    servers,
    paths: {
      ...tsoaSpec.paths,
      ...authPaths,
    },
    components: {
      schemas: {
        ...(tsoaSpec.components?.schemas ?? {}),
        ...(betterAuthSpec.components?.schemas ?? {}),
      },
      securitySchemes: {
        ...(tsoaSpec.components?.securitySchemes ?? {}),
        ...(betterAuthSpec.components?.securitySchemes ?? {}),
      },
    },
    tags: [
      ...(tsoaSpec.tags ?? []),
      {
        name: "Authentication",
        description: "Better Auth authentication endpoints",
      },
    ],
  };
}
