import { eq, and, desc } from "drizzle-orm";
import { crmContacts } from "../drizzle/index.js";
import type { DbDeps } from "../deps.js";
import type { Contact, CreateContactInput, UpdateContactInput } from "./types.js";

export async function createContact(deps: DbDeps, input: CreateContactInput): Promise<Contact> {
  const [contact] = await deps.drizzle.insert(crmContacts).values(input).returning();
  return contact;
}

export async function getContactById(deps: DbDeps, contactId: string): Promise<Contact | undefined> {
  return deps.drizzle.query.crmContacts.findFirst({
    where: eq(crmContacts.id, contactId),
  });
}

export async function getContactByOdooId(
  deps: DbDeps,
  odooPartnerId: number,
  organizationId: string,
): Promise<Contact | undefined> {
  return deps.drizzle.query.crmContacts.findFirst({
    where: (t, { eq, and }) => and(eq(t.odooPartnerId, odooPartnerId), eq(t.organizationId, organizationId)),
  });
}

export async function getContactsByOrganization(
  deps: DbDeps,
  organizationId: string,
  filters?: {
    isCustomer?: boolean;
    isSupplier?: boolean;
  },
): Promise<Contact[]> {
  const conditions = [eq(crmContacts.organizationId, organizationId)];

  if (filters?.isCustomer !== undefined) {
    conditions.push(eq(crmContacts.isCustomer, filters.isCustomer));
  }
  if (filters?.isSupplier !== undefined) {
    conditions.push(eq(crmContacts.isSupplier, filters.isSupplier));
  }

  return deps.drizzle.query.crmContacts.findMany({
    where: and(...conditions),
    orderBy: [desc(crmContacts.createdAt)],
  });
}

export async function updateContact(
  deps: DbDeps,
  contactId: string,
  input: UpdateContactInput,
): Promise<Contact> {
  const [updated] = await deps.drizzle
    .update(crmContacts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(crmContacts.id, contactId))
    .returning();
  return updated;
}

export async function syncContact(deps: DbDeps, contactData: CreateContactInput): Promise<Contact> {
  const existing = contactData.odooPartnerId
    ? await getContactByOdooId(deps, contactData.odooPartnerId, contactData.organizationId)
    : undefined;

  if (existing) {
    return updateContact(deps, existing.id, {
      ...contactData,
      lastSyncedAt: new Date(),
    });
  }
  return createContact(deps, {
    ...contactData,
    lastSyncedAt: new Date(),
  });
}
