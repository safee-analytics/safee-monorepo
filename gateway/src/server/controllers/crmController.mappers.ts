import type { odoo } from "@safee/database";
type OdooLead = odoo.OdooLead;
type OdooStage = odoo.OdooStage;
type OdooContact = odoo.OdooContact;
type OdooActivity = odoo.OdooActivity;
type OdooTeam = odoo.OdooTeam;
type OdooLostReason = odoo.OdooLostReason;
import type {
  LeadResponse,
  StageResponse,
  ContactResponse,
  ActivityResponse,
  TeamResponse,
  LostReasonResponse,
  OdooRelation,
} from "../dtos/crm.js";

function mapRelation(tuple: [number, string] | undefined): OdooRelation | undefined {
  if (!tuple) return undefined;
  return { id: tuple[0], name: tuple[1] };
}

export function mapLead(lead: OdooLead): LeadResponse {
  return {
    id: lead.id,
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
    state: mapRelation(lead.state_id),
    country: mapRelation(lead.country_id),
    zip: lead.zip,
    partner: mapRelation(lead.partner_id),
    stage: mapRelation(lead.stage_id),
    team: mapRelation(lead.team_id),
    user: mapRelation(lead.user_id),
    company: mapRelation(lead.company_id),
    campaign: mapRelation(lead.campaign_id),
    source: mapRelation(lead.source_id),
    medium: mapRelation(lead.medium_id),
    language: mapRelation(lead.lang_id),
    tags: lead.tag_ids,
    expectedRevenue: lead.expected_revenue,
    proratedRevenue: lead.prorated_revenue,
    recurringRevenue: lead.recurring_revenue,
    recurringPlan: mapRelation(lead.recurring_plan),
    recurringRevenueMonthly: lead.recurring_revenue_monthly,
    probability: lead.probability,
    dateOpen: lead.date_open,
    dateDeadline: lead.date_deadline,
    dateClosed: lead.date_closed,
    dateConversion: lead.date_conversion,
    dateLastStageUpdate: lead.date_last_stage_update,
    priority: lead.priority,
    active: lead.active,
    description: lead.description,
    referred: lead.referred,
    color: lead.color,
    lostReason: mapRelation(lead.lost_reason_id),
  };
}

export function mapStage(stage: OdooStage): StageResponse {
  return {
    id: stage.id,
    name: stage.name,
    sequence: stage.sequence,
    fold: stage.fold,
    isWon: stage.is_won,
    requirements: stage.requirements,
    team: mapRelation(stage.team_id),
  };
}

export function mapContact(contact: OdooContact): ContactResponse {
  return {
    id: contact.id,
    name: contact.name,
    isCompany: contact.is_company,
    companyType: contact.company_type,
    email: contact.email,
    phone: contact.phone,
    mobile: contact.phone_mobile_search,
    website: contact.website,
    function: contact.function,
    comment: contact.comment,
    street: contact.street,
    street2: contact.street2,
    city: contact.city,
    state: mapRelation(contact.state_id),
    country: mapRelation(contact.country_id),
    zip: contact.zip,
    vat: contact.vat,
    industry: mapRelation(contact.industry_id),
    ref: contact.ref,
    barcode: contact.barcode,
    isCustomer: (contact.customer_rank ?? 0) > 0,
    isSupplier: (contact.supplier_rank ?? 0) > 0,
    active: contact.active,
  };
}

export function mapActivity(activity: OdooActivity): ActivityResponse {
  return {
    id: activity.id,
    leadId: activity.res_id,
    activityType: { id: activity.activity_type_id[0], name: activity.activity_type_id[1] },
    summary: activity.summary,
    note: activity.note,
    dateDeadline: activity.date_deadline,
    user: { id: activity.user_id[0], name: activity.user_id[1] },
    state: activity.state,
  };
}

export function mapTeam(team: OdooTeam): TeamResponse {
  return {
    id: team.id,
    name: team.name,
    active: team.active,
    leader: mapRelation(team.user_id),
    memberIds: team.member_ids,
  };
}

export function mapLostReason(reason: OdooLostReason): LostReasonResponse {
  return {
    id: reason.id,
    name: reason.name,
    active: reason.active,
  };
}
