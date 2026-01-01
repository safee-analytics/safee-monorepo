// CRM Controller DTOs - Odoo API Types
import type { OdooRelation } from "./shared.js";

export interface LeadResponse {
  id: number;
  name: string;
  type: string;

  contactName?: string;
  partnerName?: string;
  emailFrom?: string;
  phone?: string;
  website?: string;
  function?: string;

  street?: string;
  street2?: string;
  city?: string;
  state?: OdooRelation;
  country?: OdooRelation;
  zip?: string;

  partner?: OdooRelation;
  stage?: OdooRelation;
  team?: OdooRelation;
  user?: OdooRelation;
  company?: OdooRelation;
  campaign?: OdooRelation;
  source?: OdooRelation;
  medium?: OdooRelation;
  language?: OdooRelation;
  tags?: number[];

  expectedRevenue?: number;
  proratedRevenue?: number;
  recurringRevenue?: number;
  recurringPlan?: OdooRelation;
  recurringRevenueMonthly?: number;

  probability?: number;

  dateOpen?: string;
  dateDeadline?: string;
  dateClosed?: string;
  dateConversion?: string;
  dateLastStageUpdate?: string;

  priority?: string;
  active?: boolean;

  description?: string;
  referred?: string;
  color?: number;
  lostReason?: OdooRelation;
}

export interface StageResponse {
  id: number;
  name: string;
  sequence?: number;
  fold?: boolean;
  isWon?: boolean;
  requirements?: string;
  team?: OdooRelation;
}

export interface ContactResponse {
  id: number;
  name: string;
  isCompany?: boolean;
  companyType?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  function?: string;
  comment?: string;

  street?: string;
  street2?: string;
  city?: string;
  state?: OdooRelation;
  country?: OdooRelation;
  zip?: string;

  vat?: string;
  industry?: OdooRelation;
  ref?: string;
  barcode?: string;

  isCustomer?: boolean;
  isSupplier?: boolean;
  active?: boolean;
}

export interface ActivityResponse {
  id: number;
  leadId: number;
  activityType: OdooRelation;
  summary?: string;
  note?: string;
  dateDeadline: string;
  user: OdooRelation;
  state: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  active?: boolean;
  leader?: OdooRelation;
  memberIds?: number[];
}

export interface LostReasonResponse {
  id: number;
  name: string;
  active?: boolean;
}

export interface CreateLeadRequest {
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
}

export interface UpdateLeadRequest {
  name?: string;
  stageId?: number;
  userId?: number;
  expectedRevenue?: number;
  dateDeadline?: string;
  priority?: string;
  description?: string;
}

export interface CreateContactRequest {
  name: string;
  isCompany?: boolean;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  street?: string;
  city?: string;
  zip?: string;
  countryId?: number;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  street?: string;
  city?: string;
  zip?: string;
}

export interface CreateActivityRequest {
  leadId: number;
  activityTypeId: number;
  summary?: string;
  note?: string;
  dateDeadline: string;
  userId?: number;
}

export { OdooRelation };
