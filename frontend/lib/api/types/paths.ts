/**
 * Unified paths type combining all API modules
 */

import type { paths as AccountingPaths } from "./accounting.js";
import type { paths as AuditPaths } from "./audit.js";
import type { paths as ReportsPaths } from "./reports.js";
import type { paths as CollaborationPaths } from "./collaboration.js";
import type { paths as CrmPaths } from "./crm.js";
import type { paths as HrPaths } from "./hr.js";
import type { paths as WorkflowsPaths } from "./workflows.js";
import type { paths as StoragePaths } from "./storage.js";
import type { paths as IntegrationsPaths } from "./integrations.js";
import type { paths as SettingsPaths } from "./settings.js";
import type { paths as UsersPaths } from "./users.js";
import type { paths as DashboardPaths } from "./dashboard.js";
import type { paths as OcrPaths } from "./ocr.js";
import type { paths as HealthPaths } from "./health.js";

export type paths = AccountingPaths &
  AuditPaths &
  ReportsPaths &
  CollaborationPaths &
  CrmPaths &
  HrPaths &
  WorkflowsPaths &
  StoragePaths &
  IntegrationsPaths &
  SettingsPaths &
  UsersPaths &
  DashboardPaths &
  OcrPaths &
  HealthPaths;
