import type { DrizzleClient } from "@safee/database";
import {
  createAuditReport,
  getAuditReportTemplateById,
  getCaseById,
  updateAuditReport,
} from "@safee/database";
import { pino } from "pino";
import { OperationFailed, InvalidInput, NotFound } from "../../errors.js";
import type { GenerateReportRequest, AuditReportResponse } from "../../dtos/reports.js";

export async function generateReport(
  drizzle: DrizzleClient,
  userId: string,
  request: GenerateReportRequest,
): Promise<AuditReportResponse> {
  const logger = pino();
  const deps = { drizzle, logger };

  const caseData = await getCaseById(deps, request.caseId);
  if (!caseData) {
    throw new NotFound("Case not found");
  }

  const template = await getAuditReportTemplateById(deps, request.templateId);
  if (!template) {
    throw new NotFound("Report template not found");
  }

  if (!template.isActive) {
    throw new InvalidInput("Report template is not active");
  }

  if (!request.title || request.title.trim().length === 0) {
    throw new InvalidInput("Report title cannot be empty");
  }

  try {
    const newReport = await createAuditReport(deps, {
      caseId: request.caseId,
      templateId: request.templateId,
      title: request.title.trim(),
      status: "generating",
      settings: request.settings,
      generatedBy: userId,
    });

    logger.info(
      {
        reportId: newReport.id,
        caseId: request.caseId,
        templateId: request.templateId,
        userId,
      },
      "Report generation started",
    );

    setTimeout(
      () =>
        void (async () => {
          try {
            const aggregatedData = {
              caseNumber: caseData.caseNumber,
              title: caseData.title,
              caseType: caseData.caseType,
              status: caseData.status,
              generatedAt: new Date().toISOString(),
              locale: request.settings?.locale ?? "en",
            };

            await updateAuditReport(deps, newReport.id, {
              status: "ready",
              generatedData: aggregatedData,
              generatedAt: new Date(),
            });

            logger.info(
              {
                reportId: newReport.id,
                caseId: request.caseId,
              },
              "Report generated successfully",
            );
          } catch (err) {
            logger.error({ error: err, reportId: newReport.id }, "Report generation failed");
            await updateAuditReport(deps, newReport.id, {
              status: "failed",
            });
          }
        })(),
      0,
    );

    return {
      id: newReport.id,
      caseId: newReport.caseId,
      templateId: newReport.templateId,
      title: newReport.title,
      status: newReport.status,
      generatedData: newReport.generatedData,
      settings: newReport.settings,
      filePath: newReport.filePath,
      generatedAt: newReport.generatedAt,
      generatedBy: newReport.generatedBy,
      createdAt: newReport.createdAt,
      updatedAt: newReport.updatedAt,
    };
  } catch (err) {
    if (err instanceof NotFound || err instanceof InvalidInput) {
      throw err;
    }

    logger.error({ error: err, userId, request }, "Failed to start report generation");
    throw new OperationFailed("Failed to start report generation");
  }
}
