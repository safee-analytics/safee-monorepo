import { eq, and, sql } from "drizzle-orm";
import type { DbDeps } from "../deps.js";
import { emailBounces } from "../drizzle/emailBounces.js";
import { users } from "../drizzle/users.js";

export interface RecordBounceInput {
  email: string;
  bounceType: "hard" | "soft" | "complaint" | "unsubscribe";
  reason?: string;
  messageId?: string;
}

export async function recordEmailBounce(deps: DbDeps, input: RecordBounceInput) {
  const { drizzle, logger } = deps;
  const { email, bounceType, reason, messageId } = input;

  // Find user by email
  const user = await drizzle.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Check if bounce already exists
  const existing = await drizzle.query.emailBounces.findFirst({
    where: and(eq(emailBounces.email, email), eq(emailBounces.bounceType, bounceType)),
  });

  if (existing) {
    // Update bounce count
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
    // Create new bounce record
    await drizzle.insert(emailBounces).values({
      userId: user?.id,
      email,
      bounceType,
      reason,
      messageId,
      bounceCount: 1,
      lastBouncedAt: new Date(),
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

  // Check for hard bounces or unsubscribes
  const bounce = await drizzle.query.emailBounces.findFirst({
    where: and(eq(emailBounces.email, email)),
  });

  if (!bounce) {
    return true;
  }

  // Don't send to hard bounces or unsubscribes
  if (bounce.bounceType === "hard" || bounce.bounceType === "unsubscribe") {
    return false;
  }

  // Don't send if soft bounce count is too high (>5)
  if (bounce.bounceType === "soft" && bounce.bounceCount > 5) {
    return false;
  }

  return true;
}

export async function getEmailBounces(deps: DbDeps, email: string) {
  const { drizzle } = deps;

  return drizzle.query.emailBounces.findMany({
    where: eq(emailBounces.email, email),
    orderBy: (bounces, { desc }) => [desc(bounces.lastBouncedAt)],
  });
}
