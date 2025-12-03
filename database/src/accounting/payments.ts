import { eq, and } from "drizzle-orm";
import { accountingPayments } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Payment, CreatePaymentInput, UpdatePaymentInput } from "./types.js";

export async function createPayment(deps: DbDeps, input: CreatePaymentInput): Promise<Payment> {
  const [payment] = await deps.drizzle.insert(accountingPayments).values(input).returning();
  return payment;
}

export async function getPaymentById(deps: DbDeps, paymentId: string): Promise<Payment | undefined> {
  return deps.drizzle.query.accountingPayments.findFirst({
    where: eq(accountingPayments.id, paymentId),
  });
}

export async function getPaymentByOdooId(
  deps: DbDeps,
  odooPaymentId: number,
  organizationId: string,
): Promise<Payment | undefined> {
  return deps.drizzle.query.accountingPayments.findFirst({
    where: and(
      eq(accountingPayments.odooPaymentId, odooPaymentId),
      eq(accountingPayments.organizationId, organizationId),
    ),
  });
}

export async function updatePayment(
  deps: DbDeps,
  paymentId: string,
  input: UpdatePaymentInput,
): Promise<Payment> {
  const [updated] = await deps.drizzle
    .update(accountingPayments)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(accountingPayments.id, paymentId))
    .returning();
  return updated;
}

export async function deletePayment(deps: DbDeps, paymentId: string): Promise<void> {
  await deps.drizzle.delete(accountingPayments).where(eq(accountingPayments.id, paymentId));
}

export async function syncPayment(deps: DbDeps, paymentData: CreatePaymentInput): Promise<Payment> {
  const existing = paymentData.odooPaymentId
    ? await getPaymentByOdooId(deps, paymentData.odooPaymentId, paymentData.organizationId)
    : undefined;

  if (existing) {
    return updatePayment(deps, existing.id, {
      ...paymentData,
      lastSyncedAt: new Date(),
    });
  }
  return createPayment(deps, {
    ...paymentData,
    lastSyncedAt: new Date(),
  });
}
