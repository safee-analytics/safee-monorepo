export {
  OdooDatabaseService,
  type OdooDatabaseServiceDependencies,
  type OdooConfig,
} from "./database.service.js";
export { OdooModuleService } from "./module.service.js";
export {
  OdooUserProvisioningService,
  type OdooUserProvisioningServiceDependencies,
  type OdooUserProvisionResult,
  type OdooUserCredentials,
} from "./user-provisioning.service.js";
export {
  OdooClientManager,
  initOdooClientManager,
  getOdooClientManager,
  type OdooClientManagerDependencies,
  type OdooClientManagerConfig,
} from "./manager.service.js";
export { OdooClient, OdooLanguage, OdooDemo } from "./client.js";
export type { OdooClient as OdooClientType } from "./client.service.js";
export { OdooClientService, createOdooClient } from "./client.service.js";
export { OdooCRMService } from "./crm.service.js";
export type {
  OdooLead,
  OdooStage,
  OdooContact,
  OdooActivity,
  OdooTeam,
  OdooLostReason,
} from "./crm.service.js";
export { OdooHRService, parseEmployeeType, parseGender, parseMaritalStatus } from "./hr.service.js";
export type {
  OdooEmployee,
  OdooDepartment,
  OdooContract,
  OdooLeaveType,
  OdooLeaveRequest,
  OdooLeaveAllocation,
  OdooPayslip,
  OdooPayslipLine,
} from "./hr.service.js";
export type { OdooWebhookConfig } from "./webhookConfig.service.js";
export { getOdooWebhookConfig, configureOdooWebhooks } from "./webhookConfig.service.js";
export { EncryptionService } from "../encryption.js";
export * from "./errors.js";
export type {
  OdooAccount,
  OdooInvoiceLine,
  OdooInvoice,
  OdooPayment,
  OdooJournal,
  OdooPartner,
  OdooTax,
  OdooGLEntry,
  OdooAccountBalanceReport,
  OdooPartnerLedgerReport,
  OdooFinancialReport,
  CreateInvoiceDTO,
  CreateRefundDTO,
  CreatePaymentDTO,
  AccountBalanceQuery,
  PartnerLedgerQuery,
  FinancialReportQuery,
} from "./accounting.types.js";
export { OdooAccountingService } from "./accounting.service.js";
