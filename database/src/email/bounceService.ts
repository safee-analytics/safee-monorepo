import { eq, and, sql } from "drizzle-orm";
import type { DbDeps } from "../deps.js";
import { emailBounces } from "../drizzle/emailBounces.js";
import { users } from "../drizzle/users.js";
import { now } from "../drizzle.js";

export interface RecordBounceInput {
  email: string;
  bounceType: "hard" | "soft" | "complaint" | "unsubscribe";
  reason?: string;
  messageId?: string;
}

export async function recordEmailBounce(deps: DbDeps, input: RecordBounceInput) {
  const { drizzle, logger } = deps;
  const { email, bounceType, reason, messageId } = input;

  const user = await drizzle.query.users.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });

  const existing = await drizzle.query.emailBounces.findFirst({
    where: (t, { eq, and }) => and(eq(t.email, email), eq(t.bounceType, bounceType)),
  });

  if (existing) {
    await drizzle
      .update(emailBounces)
      .set({
        bounceCount: sql`${emailBounces.bounceCount} + 1`,
        lastBouncedAt: new Date(),
        reason: reason ?? existing.reason,
        messageId: messageId ?? existing.messageId,
      })
      .where(eq(emailBounces.id, existing.id));

    logger.info({ email, bounceType, bounceCount: existing.bounceCount + 1 }, "Email bounce updated");
  } else {
    await drizzle.insert(emailBounces).values({
      userId: user?.id,
      email,
      bounceType,
      reason,
      messageId,
      bounceCount: 1,
      lastBouncedAt: now(),
    });

    logger.info({ email, bounceType }, "Email bounce recorded");
  }

  // For hard bounces, consider marking user email as unverified or flagging account
  if (bounceType === "hard" && user) {
    logger.warn({ userId: user.id, email }, "Hard bounce detected - consider flagging user account");
    // TODO: Add logic to flag user account or mark email as invalid
  }
}

export async function shouldSendEmail(deps: DbDeps, email: string): Promise<boolean> {
  const { drizzle } = deps;

  const bounce = await drizzle.query.emailBounces.findFirst({
    where: (t, { eq }) => eq(t.email, email),
  });

  if (!bounce) {
    return true;
  }

  if (bounce.bounceType === "hard" || bounce.bounceType === "unsubscribe") {
    return false;
  }

  if (bounce.bounceType === "soft" && bounce.bounceCount > 5) {
    return false;
  }

  return true;
}

export async function getEmailBounces(deps: DbDeps, email: string) {
  const { drizzle } = deps;

  return drizzle.query.emailBounces.findMany({
    where: (t, { eq }) => eq(t.email, email),
    orderBy: (bounces, { desc }) => [desc(bounces.lastBouncedAt)],
  });
}
