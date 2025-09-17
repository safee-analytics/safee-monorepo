import { RuleTester } from "@typescript-eslint/rule-tester";
import { rule } from "./drizzle.js";
import { after, describe, it } from "node:test";

RuleTester.afterAll = after;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.describe = describe;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("drizzle", rule, {
  invalid: [
    {
      code: "drizzle.transaction((tx) => drizzle.query.users.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(async (tx) => drizzle.query.users.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: `
        drizzle.transaction(async (tx) => {
          const items = await tx.users.findMany();
          return drizzle.players.findMany();
        });
      `,
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(function (tx) { return drizzle.query.users.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
    {
      code: "drizzle.transaction(function (tx) { return someSubFunction({ drizzle }) });",
      options: [{ drizzleNames: ["drizzle"] }],
      errors: [{ messageId: "drizzle-client-in-transaction" }],
    },
  ],
  valid: [
    {
      code: "drizzle.transaction(async (tx) => tx.query.users.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (tx) { return tx.query.users.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(async (drizzle) => drizzle.query.users.findMany());",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (drizzle) { return drizzle.query.users.findMany() });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.query.users.findMany();
        drizzle.transaction(async (tx) => tx.query.users.findMany());
        drizzle.query.users.findMany();
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.transaction(async (tx) => tx.query.users.findMany());
        drizzle.transaction(async (tx) => tx.query.users.findMany());
        drizzle.transaction(async (tx) => tx.query.users.findMany());
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: `
        drizzle.query.users.findMany();
        drizzle.transaction(async (drizzle) => drizzle.query.users.findMany());
        drizzle.query.users.findMany();
      `,
      options: [{ drizzleNames: ["drizzle"] }],
    },
    {
      code: "drizzle.transaction(function (tx) { return someSubFunction({ drizzle: tx }) });",
      options: [{ drizzleNames: ["drizzle"] }],
    },
  ],
});
