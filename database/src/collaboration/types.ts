import type { CaseActivity, NewCaseActivity, CasePresence, NewCasePresence } from "../drizzle/index.js";

export type { CaseActivity, CasePresence };

export type CreateCaseActivityInput = Omit<NewCaseActivity, "id" | "createdAt">;

export type UpdatePresenceInput = Omit<NewCasePresence, "id" | "lastSeenAt">;

export type CaseActivityWithUser = CaseActivity & {
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export type CasePresenceWithUser = CasePresence & {
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};
