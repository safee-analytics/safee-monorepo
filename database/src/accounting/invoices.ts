import { eq, and } from "drizzle-orm";
import { accountingInvoices } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Invoice, CreateInvoiceInput, UpdateInvoiceInput } from "./types.js";

export async function createInvoice(deps: DbDeps, input: CreateInvoiceInput): Promise<Invoice> {
  const [invoice] = await deps.drizzle.insert(accountingInvoices).values(input).returning();
  return invoice;
}

export async function getInvoiceById(deps: DbDeps, invoiceId: string): Promise<Invoice | undefined> {
  return deps.drizzle.query.accountingInvoices.findFirst({
    where: eq(accountingInvoices.id, invoiceId),
  });
}

export async function getInvoiceByOdooId(
  deps: DbDeps,
  odooInvoiceId: number,
  organizationId: string,
): Promise<Invoice | undefined> {
  return deps.drizzle.query.accountingInvoices.findFirst({
    where: and(
      eq(accountingInvoices.odooInvoiceId, odooInvoiceId),
      eq(accountingInvoices.organizationId, organizationId),
    ),
  });
}

export async function updateInvoice(
  deps: DbDeps,
  invoiceId: string,
  input: UpdateInvoiceInput,
): Promise<Invoice> {
  const [updated] = await deps.drizzle
    .update(accountingInvoices)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(accountingInvoices.id, invoiceId))
    .returning();
  return updated;
}

export async function deleteInvoice(deps: DbDeps, invoiceId: string): Promise<void> {
  await deps.drizzle.delete(accountingInvoices).where(eq(accountingInvoices.id, invoiceId));
}

export async function syncInvoice(deps: DbDeps, invoiceData: CreateInvoiceInput): Promise<Invoice> {
  const existing = invoiceData.odooInvoiceId
    ? await getInvoiceByOdooId(deps, invoiceData.odooInvoiceId, invoiceData.organizationId)
    : undefined;

  if (existing) {
    return updateInvoice(deps, existing.id, {
      ...invoiceData,
      lastSyncedAt: new Date(),
    });
  }
  return createInvoice(deps, {
    ...invoiceData,
    lastSyncedAt: new Date(),
  });
}
