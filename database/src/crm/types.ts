import type {
  crmLeads,
  crmStages,
  crmContacts,
  crmActivities,
  crmTeams,
  crmLostReasons,
} from "../drizzle/index.js";

export type Lead = typeof crmLeads.$inferSelect;
export type CreateLeadInput = typeof crmLeads.$inferInsert;
export type UpdateLeadInput = Partial<Omit<CreateLeadInput, "id" | "organizationId" | "createdAt">>;

export type Stage = typeof crmStages.$inferSelect;
export type CreateStageInput = typeof crmStages.$inferInsert;
export type UpdateStageInput = Partial<Omit<CreateStageInput, "id" | "organizationId" | "createdAt">>;

export type Contact = typeof crmContacts.$inferSelect;
export type CreateContactInput = typeof crmContacts.$inferInsert;
export type UpdateContactInput = Partial<Omit<CreateContactInput, "id" | "organizationId" | "createdAt">>;

export type Activity = typeof crmActivities.$inferSelect;
export type CreateActivityInput = typeof crmActivities.$inferInsert;
export type UpdateActivityInput = Partial<Omit<CreateActivityInput, "id" | "organizationId" | "createdAt">>;

export type Team = typeof crmTeams.$inferSelect;
export type CreateTeamInput = typeof crmTeams.$inferInsert;

export type LostReason = typeof crmLostReasons.$inferSelect;
export type CreateLostReasonInput = typeof crmLostReasons.$inferInsert;

export interface LeadWithRelations extends Lead {
  stage?: Stage | null;
  contact?: Contact | null;
  team?: Team | null;
}
