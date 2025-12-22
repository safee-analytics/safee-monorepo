import { odoo } from "@safee/database";
type OdooClient = odoo.OdooClientType;
import type { DbDeps } from "@safee/database";
import { syncLead, syncContact } from "@safee/database";

export interface CRMSyncResult {
  leadsSync: number;
  stagesSync: number;
  contactsSync: number;
  activitiesSync: number;
  teamsSync: number;
  lostReasonsSync: number;
  errors: string[];
}

export class CRMSyncService {
  private crmService: odoo.OdooCRMService;

  constructor(
    private readonly odooClient: OdooClient,
    private readonly db: DbDeps,
    private readonly organizationId: string,
  ) {
    this.crmService = new odoo.OdooCRMService(odooClient);
  }

  async syncAll(): Promise<CRMSyncResult> {
    const result: CRMSyncResult = {
      leadsSync: 0,
      stagesSync: 0,
      contactsSync: 0,
      activitiesSync: 0,
      teamsSync: 0,
      lostReasonsSync: 0,
      errors: [],
    };

    await Promise.allSettled([
      this.syncLeads(result),
      this.syncContacts(result),
      this.syncStages(result),
      this.syncTeams(result),
      this.syncLostReasons(result),
    ]);

    return result;
  }

  private async syncLeads(result: CRMSyncResult): Promise<void> {
    try {
      const leads = await this.crmService.getLeads({ active: true });

      for (const lead of leads) {
        try {
          await syncLead(this.db, {
            organizationId: this.organizationId,
            odooLeadId: lead.id,
            name: lead.name,
            type: lead.type,
            contactName: lead.contact_name,
            partnerName: lead.partner_name,
            emailFrom: lead.email_from,
            phone: lead.phone,
            website: lead.website,
            function: lead.function,
            street: lead.street,
            street2: lead.street2,
            city: lead.city,
            stateId: lead.state_id?.[0],
            countryId: lead.country_id?.[0],
            zip: lead.zip,
            partnerId: lead.partner_id?.[0],
            commercialPartnerId: lead.commercial_partner_id?.[0],
            stageId: lead.stage_id?.[0],
            teamId: lead.team_id?.[0],
            userId: lead.user_id?.[0],
            companyId: lead.company_id?.[0],
            campaignId: lead.campaign_id?.[0],
            sourceId: lead.source_id?.[0],
            mediumId: lead.medium_id?.[0],
            langId: lead.lang_id?.[0],
            expectedRevenue: lead.expected_revenue?.toString(),
            proratedRevenue: lead.prorated_revenue?.toString(),
            recurringRevenue: lead.recurring_revenue?.toString(),
            recurringPlan: lead.recurring_plan?.[0],
            recurringRevenueMonthly: lead.recurring_revenue_monthly?.toString(),
            probability: lead.probability?.toString(),
            dateOpen: lead.date_open ? new Date(lead.date_open) : undefined,
            dateDeadline: lead.date_deadline ? new Date(lead.date_deadline) : undefined,
            dateClosed: lead.date_closed ? new Date(lead.date_closed) : undefined,
            dateConversion: lead.date_conversion ? new Date(lead.date_conversion) : undefined,
            dateLastStageUpdate: lead.date_last_stage_update
              ? new Date(lead.date_last_stage_update)
              : undefined,
            priority: lead.priority,
            active: lead.active ?? true,
            description: lead.description,
            referred: lead.referred,
            tagIds: lead.tag_ids,
            lostReasonId: lead.lost_reason_id?.[0],
            color: lead.color,
          });
          result.leadsSync++;
        } catch (err) {
          result.errors.push(`Failed to sync lead ${lead.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      result.errors.push(`Failed to fetch leads: ${(err as Error).message}`);
    }
  }

  private async syncContacts(result: CRMSyncResult): Promise<void> {
    try {
      const contacts = await this.crmService.getContacts();

      for (const contact of contacts) {
        try {
          await syncContact(this.db, {
            organizationId: this.organizationId,
            odooPartnerId: contact.id,
            name: contact.name,
            isCompany: contact.is_company ?? false,
            companyType: contact.company_type,
            email: contact.email,
            phone: contact.phone,
            phoneMobileSearch: contact.phone_mobile_search,
            website: contact.website,
            function: contact.function,
            comment: contact.comment,
            street: contact.street,
            street2: contact.street2,
            city: contact.city,
            stateId: contact.state_id?.[0],
            countryId: contact.country_id?.[0],
            zip: contact.zip,
            vat: contact.vat,
            industryId: contact.industry_id?.[0],
            isCustomer: (contact.customer_rank ?? 0) > 0,
            isSupplier: (contact.supplier_rank ?? 0) > 0,
            active: contact.active ?? true,
          });
          result.contactsSync++;
        } catch (err) {
          result.errors.push(`Failed to sync contact ${contact.id}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      result.errors.push(`Failed to fetch contacts: ${(err as Error).message}`);
    }
  }

  private async syncStages(result: CRMSyncResult): Promise<void> {
    try {
      const stages = await this.crmService.getStages({});
      result.stagesSync = stages.length;
    } catch (err) {
      result.errors.push(`Failed to sync stages: ${(err as Error).message}`);
    }
  }

  private async syncTeams(result: CRMSyncResult): Promise<void> {
    try {
      const teams = await this.crmService.getTeams({});
      result.teamsSync = teams.length;
    } catch (err) {
      result.errors.push(`Failed to sync teams: ${(err as Error).message}`);
    }
  }

  private async syncLostReasons(result: CRMSyncResult): Promise<void> {
    try {
      const reasons = await this.crmService.getLostReasons({});
      result.lostReasonsSync = reasons.length;
    } catch (err) {
      result.errors.push(`Failed to sync lost reasons: ${(err as Error).message}`);
    }
  }

  async syncLeadsOnly(): Promise<Pick<CRMSyncResult, "leadsSync" | "errors">> {
    const result: CRMSyncResult = {
      leadsSync: 0,
      stagesSync: 0,
      contactsSync: 0,
      activitiesSync: 0,
      teamsSync: 0,
      lostReasonsSync: 0,
      errors: [],
    };

    await this.syncLeads(result);

    return {
      leadsSync: result.leadsSync,
      errors: result.errors,
    };
  }

  async syncContactsOnly(): Promise<Pick<CRMSyncResult, "contactsSync" | "errors">> {
    const result: CRMSyncResult = {
      leadsSync: 0,
      stagesSync: 0,
      contactsSync: 0,
      activitiesSync: 0,
      teamsSync: 0,
      lostReasonsSync: 0,
      errors: [],
    };

    await this.syncContacts(result);

    return {
      contactsSync: result.contactsSync,
      errors: result.errors,
    };
  }
}
