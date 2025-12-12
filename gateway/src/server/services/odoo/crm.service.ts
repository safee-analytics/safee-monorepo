import type { OdooClient } from "./client.service.js";

export interface OdooLead {
  id: number;
  name: string;
  type: string;

  contact_name?: string;
  partner_name?: string;
  email_from?: string;
  phone?: string;
  website?: string;
  function?: string;

  street?: string;
  street2?: string;
  city?: string;
  state_id?: [number, string];
  country_id?: [number, string];
  zip?: string;

  partner_id?: [number, string];
  commercial_partner_id?: [number, string];
  stage_id?: [number, string];
  team_id?: [number, string];
  user_id?: [number, string];
  company_id?: [number, string];
  campaign_id?: [number, string];
  source_id?: [number, string];
  medium_id?: [number, string];
  lang_id?: [number, string];
  tag_ids?: number[];

  expected_revenue?: number;
  prorated_revenue?: number;
  recurring_revenue?: number;
  recurring_plan?: [number, string];
  recurring_revenue_monthly?: number;

  probability?: number;

  date_open?: string;
  date_deadline?: string;
  date_closed?: string;
  date_conversion?: string;
  date_last_stage_update?: string;

  priority?: string;
  active?: boolean;

  description?: string;
  referred?: string;
  color?: number;
  lost_reason_id?: [number, string];
}

export interface OdooStage {
  id: number;
  name: string;
  sequence?: number;
  fold?: boolean;
  is_won?: boolean;
  rotting_threshold_days?: number;
  requirements?: string;
  team_ids?: number[];
  color?: number;
}

export interface OdooContact {
  id: number;
  name: string;
  is_company?: boolean;
  company_type?: string;
  email?: string;
  phone?: string;
  phone_mobile_search?: string;
  website?: string;
  function?: string;
  comment?: string;

  street?: string;
  street2?: string;
  city?: string;
  state_id?: [number, string];
  country_id?: [number, string];
  zip?: string;

  vat?: string;
  industry_id?: [number, string];
  ref?: string;
  barcode?: string;

  customer_rank?: number;
  supplier_rank?: number;
  active?: boolean;
}

export interface OdooActivity {
  id: number;
  res_id: number;
  res_model: string;
  activity_type_id: [number, string];
  summary?: string;
  note?: string;
  date_deadline: string;
  user_id: [number, string];
  state: string;
}

export interface OdooTeam {
  id: number;
  name: string;
  active?: boolean;
  user_id?: [number, string];
  member_ids?: number[];
}

export interface OdooLostReason {
  id: number;
  name: string;
  active?: boolean;
}

export class OdooCRMService {
  constructor(private readonly client: OdooClient) {}

  async getLeads(filters?: {
    type?: "lead" | "opportunity";
    stageId?: number;
    teamId?: number;
    userId?: number;
    partnerId?: number;
    active?: boolean;
  }): Promise<OdooLead[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.type) {
      domain.push(["type", "=", filters.type]);
    }
    if (filters?.stageId) {
      domain.push(["stage_id", "=", filters.stageId]);
    }
    if (filters?.teamId) {
      domain.push(["team_id", "=", filters.teamId]);
    }
    if (filters?.userId) {
      domain.push(["user_id", "=", filters.userId]);
    }
    if (filters?.partnerId) {
      domain.push(["partner_id", "=", filters.partnerId]);
    }
    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooLead>("crm.lead", domain, [
      "name",
      "type",
      "contact_name",
      "partner_name",
      "email_from",
      "phone",
      "website",
      "function",
      "street",
      "street2",
      "city",
      "state_id",
      "country_id",
      "zip",
      "partner_id",
      "commercial_partner_id",
      "stage_id",
      "team_id",
      "user_id",
      "company_id",
      "campaign_id",
      "source_id",
      "medium_id",
      "lang_id",
      "tag_ids",
      "expected_revenue",
      "prorated_revenue",
      "recurring_revenue",
      "recurring_plan",
      "recurring_revenue_monthly",
      "probability",
      "date_open",
      "date_deadline",
      "date_closed",
      "date_conversion",
      "date_last_stage_update",
      "priority",
      "active",
      "description",
      "referred",
      "color",
      "lost_reason_id",
    ]);
  }

  async getLead(leadId: number): Promise<OdooLead | null> {
    const leads = await this.client.read<OdooLead>(
      "crm.lead",
      [leadId],
      [
        "name",
        "type",
        "contact_name",
        "partner_name",
        "email_from",
        "phone",
        "website",
        "function",
        "street",
        "street2",
        "city",
        "state_id",
        "country_id",
        "zip",
        "partner_id",
        "commercial_partner_id",
        "stage_id",
        "team_id",
        "user_id",
        "company_id",
        "campaign_id",
        "source_id",
        "medium_id",
        "lang_id",
        "tag_ids",
        "expected_revenue",
        "prorated_revenue",
        "recurring_revenue",
        "recurring_plan",
        "recurring_revenue_monthly",
        "probability",
        "date_open",
        "date_deadline",
        "date_closed",
        "date_conversion",
        "date_last_stage_update",
        "priority",
        "active",
        "description",
        "referred",
        "color",
        "lost_reason_id",
      ],
    );

    return leads.length > 0 ? leads[0] : null;
  }

  async createLead(data: {
    name: string;
    type?: "lead" | "opportunity";
    contactName?: string;
    emailFrom?: string;
    phone?: string;
    partnerId?: number;
    teamId?: number;
    userId?: number;
    expectedRevenue?: number;
    description?: string;
  }): Promise<number> {
    const odooData: Record<string, unknown> = {
      name: data.name,
      type: data.type ?? "lead",
      contact_name: data.contactName,
      email_from: data.emailFrom,
      phone: data.phone,
      expected_revenue: data.expectedRevenue,
      description: data.description,
    };

    if (data.partnerId) {
      odooData.partner_id = data.partnerId;
    }
    if (data.teamId) {
      odooData.team_id = data.teamId;
    }
    if (data.userId) {
      odooData.user_id = data.userId;
    }

    const filteredEntries = Object.entries(odooData).filter(
      ([, value]): value is Exclude<typeof value, undefined> => value !== undefined
    );
    odooData = Object.fromEntries(filteredEntries) as typeof odooData;

    return this.client.create("crm.lead", odooData);
  }

  async updateLead(
    leadId: number,
    data: Partial<{
      name: string;
      stageId: number;
      userId: number;
      expectedRevenue: number;
      dateDeadline: string;
      priority: string;
      description: string;
    }>,
  ): Promise<void> {
    const odooData: Record<string, unknown> = {};

    if (data.name) odooData.name = data.name;
    if (data.stageId) odooData.stage_id = data.stageId;
    if (data.userId) odooData.user_id = data.userId;
    if (data.expectedRevenue !== undefined) odooData.expected_revenue = data.expectedRevenue;
    if (data.dateDeadline) odooData.date_deadline = data.dateDeadline;
    if (data.priority) odooData.priority = data.priority;
    if (data.description) odooData.description = data.description;

    await this.client.write("crm.lead", [leadId], odooData);
  }

  async convertLeadToOpportunity(leadId: number, partnerId?: number): Promise<void> {
    const updateData: Record<string, unknown> = {
      type: "opportunity",
    };

    if (partnerId) {
      updateData.partner_id = partnerId;
    }

    await this.client.write("crm.lead", [leadId], updateData);
  }

  async markLeadAsLost(leadId: number, lostReasonId?: number): Promise<void> {
    const updateData: Record<string, unknown> = {
      active: false,
      date_closed: new Date().toISOString().split("T")[0],
    };

    if (lostReasonId) {
      updateData.lost_reason_id = lostReasonId;
    }

    await this.client.write("crm.lead", [leadId], updateData);
  }

  async markLeadAsWon(leadId: number): Promise<void> {
    const lead = await this.getLead(leadId);
    if (!lead) throw new Error("Lead not found");

    const teamId = lead.team_id ? lead.team_id[0] : undefined;
    const wonStages = await this.getStages({ teamId, isWon: true });

    if (wonStages.length === 0) {
      throw new Error("No won stage found for this team");
    }

    await this.client.write("crm.lead", [leadId], {
      stage_id: wonStages[0].id,
      date_closed: new Date().toISOString().split("T")[0],
    });
  }

  async getStages(filters?: { teamId?: number; isWon?: boolean }): Promise<OdooStage[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.teamId) {
      domain.push(["team_ids", "in", [filters.teamId]]);
    }
    if (filters?.isWon !== undefined) {
      domain.push(["is_won", "=", filters.isWon]);
    }

    return this.client.searchRead<OdooStage>("crm.stage", domain, [
      "name",
      "sequence",
      "fold",
      "is_won",
      "rotting_threshold_days",
      "requirements",
      "team_ids",
      "color",
    ]);
  }

  async getStage(stageId: number): Promise<OdooStage | null> {
    const stages = await this.client.read<OdooStage>(
      "crm.stage",
      [stageId],
      ["name", "sequence", "fold", "is_won", "rotting_threshold_days", "requirements", "team_ids", "color"],
    );

    return stages.length > 0 ? stages[0] : null;
  }

  async getContacts(filters?: {
    isCustomer?: boolean;
    isSupplier?: boolean;
    isCompany?: boolean;
  }): Promise<OdooContact[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.isCustomer) {
      domain.push(["customer_rank", ">", 0]);
    }
    if (filters?.isSupplier) {
      domain.push(["supplier_rank", ">", 0]);
    }
    if (filters?.isCompany !== undefined) {
      domain.push(["is_company", "=", filters.isCompany]);
    }

    return this.client.searchRead<OdooContact>("res.partner", domain, [
      "name",
      "is_company",
      "company_type",
      "email",
      "phone",
      "phone_mobile_search",
      "website",
      "function",
      "comment",
      "street",
      "street2",
      "city",
      "state_id",
      "country_id",
      "zip",
      "vat",
      "industry_id",
      "ref",
      "barcode",
      "customer_rank",
      "supplier_rank",
      "active",
    ]);
  }

  async getContact(partnerId: number): Promise<OdooContact | null> {
    const contacts = await this.client.read<OdooContact>(
      "res.partner",
      [partnerId],
      [
        "name",
        "is_company",
        "company_type",
        "email",
        "phone",
        "phone_mobile_search",
        "website",
        "function",
        "comment",
        "street",
        "street2",
        "city",
        "state_id",
        "country_id",
        "zip",
        "vat",
        "industry_id",
        "ref",
        "barcode",
        "customer_rank",
        "supplier_rank",
        "active",
      ],
    );

    return contacts.length > 0 ? contacts[0] : null;
  }

  async createContact(data: {
    name: string;
    isCompany?: boolean;
    email?: string;
    phone?: string;
    phoneMobileSearch?: string;
    website?: string;
    street?: string;
    city?: string;
    zip?: string;
    countryId?: number;
  }): Promise<number> {
    const odooData: Record<string, unknown> = {
      name: data.name,
      is_company: data.isCompany ?? false,
      email: data.email,
      phone: data.phone,
      phone_mobile_search: data.phoneMobileSearch,
      website: data.website,
      street: data.street,
      city: data.city,
      zip: data.zip,
    };

    if (data.countryId) {
      odooData.country_id = data.countryId;
    }

    const filteredEntries = Object.entries(odooData).filter(
      ([, value]): value is Exclude<typeof value, undefined> => value !== undefined
    );
    odooData = Object.fromEntries(filteredEntries) as typeof odooData;

    return this.client.create("res.partner", odooData);
  }

  async updateContact(
    partnerId: number,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      phone_mobile_search: string;
      website: string;
      street: string;
      city: string;
      zip: string;
    }>,
  ): Promise<void> {
    await this.client.write("res.partner", [partnerId], data);
  }

  async getActivities(filters?: {
    leadId?: number;
    userId?: number;
    state?: string;
  }): Promise<OdooActivity[]> {
    const domain: (string | [string, string, unknown])[] = [["res_model", "=", "crm.lead"]];

    if (filters?.leadId) {
      domain.push(["res_id", "=", filters.leadId]);
    }
    if (filters?.userId) {
      domain.push(["user_id", "=", filters.userId]);
    }
    // Note: state is a computed field in Odoo and cannot be used in domain filters
    // We'll filter by state in-memory after fetching

    const activities = await this.client.searchRead<OdooActivity>("mail.activity", domain, [
      "res_id",
      "res_model",
      "activity_type_id",
      "summary",
      "note",
      "date_deadline",
      "user_id",
      "state",
    ]);

    // Filter by state in-memory if requested
    if (filters?.state) {
      return activities.filter((activity) => activity.state === filters.state);
    }

    return activities;
  }

  async getActivity(activityId: number): Promise<OdooActivity | null> {
    const activities = await this.client.read<OdooActivity>(
      "mail.activity",
      [activityId],
      ["res_id", "res_model", "activity_type_id", "summary", "note", "date_deadline", "user_id", "state"],
    );

    return activities.length > 0 ? activities[0] : null;
  }

  async createActivity(data: {
    leadId: number;
    activityTypeId: number;
    summary?: string;
    note?: string;
    dateDeadline: string;
    userId?: number;
  }): Promise<number> {
    const odooData: Record<string, unknown> = {
      res_id: data.leadId,
      res_model: "crm.lead",
      activity_type_id: data.activityTypeId,
      summary: data.summary,
      note: data.note,
      date_deadline: data.dateDeadline,
    };

    if (data.userId) {
      odooData.user_id = data.userId;
    }

    const filteredEntries = Object.entries(odooData).filter(
      ([, value]): value is Exclude<typeof value, undefined> => value !== undefined
    );
    odooData = Object.fromEntries(filteredEntries) as typeof odooData;

    return this.client.create("mail.activity", odooData);
  }

  async markActivityDone(activityId: number): Promise<void> {
    await this.client.execute("mail.activity", "action_done", [[activityId]]);
  }

  async getTeams(filters?: { active?: boolean }): Promise<OdooTeam[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooTeam>("crm.team", domain, ["name", "active", "user_id", "member_ids"]);
  }

  async getTeam(teamId: number): Promise<OdooTeam | null> {
    const teams = await this.client.read<OdooTeam>(
      "crm.team",
      [teamId],
      ["name", "active", "user_id", "member_ids"],
    );

    return teams.length > 0 ? teams[0] : null;
  }

  async getLostReasons(filters?: { active?: boolean }): Promise<OdooLostReason[]> {
    const domain: [string, string, unknown][] = [];

    if (filters?.active !== false) {
      domain.push(["active", "=", true]);
    }

    return this.client.searchRead<OdooLostReason>("crm.lost.reason", domain, ["name", "active"]);
  }

  async getLostReason(reasonId: number): Promise<OdooLostReason | null> {
    const reasons = await this.client.read<OdooLostReason>("crm.lost.reason", [reasonId], ["name", "active"]);

    return reasons.length > 0 ? reasons[0] : null;
  }
}
