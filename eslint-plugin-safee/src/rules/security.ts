import { ESLintUtils, AST_NODE_TYPES } from "@typescript-eslint/utils";

export const rule = ESLintUtils.RuleCreator.withoutDocs<[], "missing-security">({
  create(context) {
    return {
      ClassDeclaration(node) {
        if (
          node.superClass &&
          node.superClass.type === AST_NODE_TYPES.Identifier &&
          node.superClass.name === "Controller"
        ) {
          for (const method of node.body.body) {
            if (method.type === AST_NODE_TYPES.MethodDefinition && method.kind === "method") {
              const hasDecorator = method.decorators.some(
                (decorator) =>
                  decorator.expression.type === AST_NODE_TYPES.CallExpression &&
                  decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
                  (decorator.expression.callee.name === "Security" ||
                    decorator.expression.callee.name === "NoSecurity"),
              );

              if (!hasDecorator) {
                context.report({
                  node: method,
                  messageId: "missing-security",
                });
              }
            }
          }
        }
      },
    };
  },
  meta: {
    docs: {
      description: "Enforces security on all tsoa endpoints",
    },
    messages: {
      "missing-security": "All endpoints should have @Security or @NoSecurity tag",
    },
    type: "problem",
    schema: [],
  },
  defaultOptions: [],
});
