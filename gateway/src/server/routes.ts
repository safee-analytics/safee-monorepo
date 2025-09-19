/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from "@tsoa/runtime";
import { fetchMiddlewares, ExpressTemplateService } from "@tsoa/runtime";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PayrollController } from "./controllers/payrollController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { InvoiceController } from "./controllers/invoiceController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HisabiqController } from "./controllers/hisabiqController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from "./controllers/healthController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EmployeeController } from "./controllers/employeeController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DealController } from "./controllers/dealController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContactController } from "./controllers/contactController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from "./controllers/authController.js";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AccountController } from "./controllers/accountController.js";
import { expressAuthentication } from "./middleware/auth.js";
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from "express";

const expressAuthenticationRecasted = expressAuthentication as (
  req: ExRequest,
  securityName: string,
  scopes?: string[],
  res?: ExResponse,
) => Promise<any>;

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
  PayrollRecord: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      employeeId: { dataType: "string", required: true },
      period: { dataType: "string", required: true },
      basicSalary: { dataType: "double", required: true },
      allowances: { dataType: "double", required: true },
      deductions: { dataType: "double", required: true },
      netPay: { dataType: "double", required: true },
      status: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["DRAFT"] },
          { dataType: "enum", enums: ["PROCESSED"] },
          { dataType: "enum", enums: ["PAID"] },
        ],
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  PayrollCreateRequest: {
    dataType: "refObject",
    properties: {
      employeeId: { dataType: "string", required: true },
      period: { dataType: "string", required: true },
      basicSalary: { dataType: "double", required: true },
      allowances: { dataType: "double", required: true },
      deductions: { dataType: "double", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Invoice: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      number: { dataType: "string", required: true },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["SALES"] },
          { dataType: "enum", enums: ["PURCHASE"] },
        ],
        required: true,
      },
      date: { dataType: "string", required: true },
      total: { dataType: "double", required: true },
      status: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  InvoiceCreateRequest: {
    dataType: "refObject",
    properties: {
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["SALES"] },
          { dataType: "enum", enums: ["PURCHASE"] },
        ],
        required: true,
      },
      customerId: { dataType: "string" },
      supplierId: { dataType: "string" },
      date: { dataType: "string", required: true },
      dueDate: { dataType: "string" },
      items: {
        dataType: "array",
        array: {
          dataType: "nestedObjectLiteral",
          nestedProperties: {
            unitPrice: { dataType: "double", required: true },
            quantity: { dataType: "double", required: true },
            description: { dataType: "string", required: true },
          },
        },
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  HealthCheck: {
    dataType: "refObject",
    properties: {
      status: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["ok"] },
          { dataType: "enum", enums: ["error"] },
        ],
        required: true,
      },
      timestamp: { dataType: "string", required: true },
      uptime: { dataType: "double", required: true },
      version: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Employee: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string", required: true },
      position: { dataType: "string", required: true },
      salary: { dataType: "double", required: true },
      startDate: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  EmployeeCreateRequest: {
    dataType: "refObject",
    properties: {
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string", required: true },
      position: { dataType: "string", required: true },
      salary: { dataType: "double", required: true },
      startDate: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Deal: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      title: { dataType: "string", required: true },
      value: { dataType: "double", required: true },
      stage: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["PROSPECT"] },
          { dataType: "enum", enums: ["QUALIFIED"] },
          { dataType: "enum", enums: ["PROPOSAL"] },
          { dataType: "enum", enums: ["NEGOTIATION"] },
          { dataType: "enum", enums: ["CLOSED_WON"] },
          { dataType: "enum", enums: ["CLOSED_LOST"] },
        ],
        required: true,
      },
      contactId: { dataType: "string", required: true },
      expectedCloseDate: { dataType: "string", required: true },
      probability: { dataType: "double", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  DealCreateRequest: {
    dataType: "refObject",
    properties: {
      title: { dataType: "string", required: true },
      value: { dataType: "double", required: true },
      contactId: { dataType: "string", required: true },
      expectedCloseDate: { dataType: "string", required: true },
      probability: { dataType: "double", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Contact: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      name: { dataType: "string", required: true },
      email: { dataType: "string", required: true },
      phone: { dataType: "string", required: true },
      company: { dataType: "string" },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["LEAD"] },
          { dataType: "enum", enums: ["CUSTOMER"] },
          { dataType: "enum", enums: ["VENDOR"] },
        ],
        required: true,
      },
      status: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["ACTIVE"] },
          { dataType: "enum", enums: ["INACTIVE"] },
        ],
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ContactCreateRequest: {
    dataType: "refObject",
    properties: {
      name: { dataType: "string", required: true },
      email: { dataType: "string", required: true },
      phone: { dataType: "string", required: true },
      company: { dataType: "string" },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["LEAD"] },
          { dataType: "enum", enums: ["CUSTOMER"] },
          { dataType: "enum", enums: ["VENDOR"] },
        ],
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  LoginResponse: {
    dataType: "refObject",
    properties: {
      token: { dataType: "string", required: true },
      user: {
        dataType: "nestedObjectLiteral",
        nestedProperties: {
          name: { dataType: "string", required: true },
          email: { dataType: "string", required: true },
          id: { dataType: "string", required: true },
        },
        required: true,
      },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  LoginRequest: {
    dataType: "refObject",
    properties: {
      email: { dataType: "string", required: true },
      password: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  RegisterRequest: {
    dataType: "refObject",
    properties: {
      email: { dataType: "string", required: true },
      password: { dataType: "string", required: true },
      name: { dataType: "string", required: true },
      organizationName: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Account: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      code: { dataType: "string", required: true },
      name: { dataType: "string", required: true },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["ASSET"] },
          { dataType: "enum", enums: ["LIABILITY"] },
          { dataType: "enum", enums: ["EQUITY"] },
          { dataType: "enum", enums: ["REVENUE"] },
          { dataType: "enum", enums: ["EXPENSE"] },
        ],
        required: true,
      },
      balance: { dataType: "double", required: true },
      parentId: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  AccountCreateRequest: {
    dataType: "refObject",
    properties: {
      code: { dataType: "string", required: true },
      name: { dataType: "string", required: true },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["ASSET"] },
          { dataType: "enum", enums: ["LIABILITY"] },
          { dataType: "enum", enums: ["EQUITY"] },
          { dataType: "enum", enums: ["REVENUE"] },
          { dataType: "enum", enums: ["EXPENSE"] },
        ],
        required: true,
      },
      parentId: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: "silently-remove-extras",
  bodyCoercion: true,
});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: Router) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################

  const argsPayrollController_getPayrollRecords: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
    _period: { in: "query", name: "_period", dataType: "string" },
  };
  app.get(
    "/api/v1/payroll",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(PayrollController),
    ...fetchMiddlewares<RequestHandler>(PayrollController.prototype.getPayrollRecords),

    async function PayrollController_getPayrollRecords(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsPayrollController_getPayrollRecords,
          request,
          response,
        });

        const controller = new PayrollController();

        await templateService.apiHandler({
          methodName: "getPayrollRecords",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsPayrollController_createPayrollRecord: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "PayrollCreateRequest" },
  };
  app.post(
    "/api/v1/payroll",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(PayrollController),
    ...fetchMiddlewares<RequestHandler>(PayrollController.prototype.createPayrollRecord),

    async function PayrollController_createPayrollRecord(
      request: ExRequest,
      response: ExResponse,
      next: any,
    ) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsPayrollController_createPayrollRecord,
          request,
          response,
        });

        const controller = new PayrollController();

        await templateService.apiHandler({
          methodName: "createPayrollRecord",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsPayrollController_processPayroll: Record<string, TsoaRoute.ParameterSchema> = {
    _request: {
      in: "body",
      name: "_request",
      required: true,
      dataType: "nestedObjectLiteral",
      nestedProperties: { period: { dataType: "string", required: true } },
    },
  };
  app.post(
    "/api/v1/payroll/process",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(PayrollController),
    ...fetchMiddlewares<RequestHandler>(PayrollController.prototype.processPayroll),

    async function PayrollController_processPayroll(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsPayrollController_processPayroll,
          request,
          response,
        });

        const controller = new PayrollController();

        await templateService.apiHandler({
          methodName: "processPayroll",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsInvoiceController_getInvoices: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
  };
  app.get(
    "/api/v1/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(InvoiceController),
    ...fetchMiddlewares<RequestHandler>(InvoiceController.prototype.getInvoices),

    async function InvoiceController_getInvoices(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsInvoiceController_getInvoices,
          request,
          response,
        });

        const controller = new InvoiceController();

        await templateService.apiHandler({
          methodName: "getInvoices",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsInvoiceController_createInvoice: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "InvoiceCreateRequest" },
  };
  app.post(
    "/api/v1/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(InvoiceController),
    ...fetchMiddlewares<RequestHandler>(InvoiceController.prototype.createInvoice),

    async function InvoiceController_createInvoice(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsInvoiceController_createInvoice,
          request,
          response,
        });

        const controller = new InvoiceController();

        await templateService.apiHandler({
          methodName: "createInvoice",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsHisabiqController_getInvoices: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
  };
  app.get(
    "/api/v1/hisabiq/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(HisabiqController),
    ...fetchMiddlewares<RequestHandler>(HisabiqController.prototype.getInvoices),

    async function HisabiqController_getInvoices(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsHisabiqController_getInvoices,
          request,
          response,
        });

        const controller = new HisabiqController();

        await templateService.apiHandler({
          methodName: "getInvoices",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsHisabiqController_createInvoice: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "InvoiceCreateRequest" },
  };
  app.post(
    "/api/v1/hisabiq/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(HisabiqController),
    ...fetchMiddlewares<RequestHandler>(HisabiqController.prototype.createInvoice),

    async function HisabiqController_createInvoice(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsHisabiqController_createInvoice,
          request,
          response,
        });

        const controller = new HisabiqController();

        await templateService.apiHandler({
          methodName: "createInvoice",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsHisabiqController_getAccounts: Record<string, TsoaRoute.ParameterSchema> = {};
  app.get(
    "/api/v1/hisabiq/accounts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(HisabiqController),
    ...fetchMiddlewares<RequestHandler>(HisabiqController.prototype.getAccounts),

    async function HisabiqController_getAccounts(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsHisabiqController_getAccounts,
          request,
          response,
        });

        const controller = new HisabiqController();

        await templateService.apiHandler({
          methodName: "getAccounts",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsHealthController_getHealth: Record<string, TsoaRoute.ParameterSchema> = {};
  app.get(
    "/api/v1/health",
    ...fetchMiddlewares<RequestHandler>(HealthController),
    ...fetchMiddlewares<RequestHandler>(HealthController.prototype.getHealth),

    async function HealthController_getHealth(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsHealthController_getHealth,
          request,
          response,
        });

        const controller = new HealthController();

        await templateService.apiHandler({
          methodName: "getHealth",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsEmployeeController_getEmployees: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
  };
  app.get(
    "/api/v1/employees",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(EmployeeController),
    ...fetchMiddlewares<RequestHandler>(EmployeeController.prototype.getEmployees),

    async function EmployeeController_getEmployees(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsEmployeeController_getEmployees,
          request,
          response,
        });

        const controller = new EmployeeController();

        await templateService.apiHandler({
          methodName: "getEmployees",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsEmployeeController_createEmployee: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "EmployeeCreateRequest" },
  };
  app.post(
    "/api/v1/employees",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(EmployeeController),
    ...fetchMiddlewares<RequestHandler>(EmployeeController.prototype.createEmployee),

    async function EmployeeController_createEmployee(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsEmployeeController_createEmployee,
          request,
          response,
        });

        const controller = new EmployeeController();

        await templateService.apiHandler({
          methodName: "createEmployee",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsDealController_getDeals: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
    _stage: { in: "query", name: "_stage", dataType: "string" },
  };
  app.get(
    "/api/v1/deals",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(DealController),
    ...fetchMiddlewares<RequestHandler>(DealController.prototype.getDeals),

    async function DealController_getDeals(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsDealController_getDeals,
          request,
          response,
        });

        const controller = new DealController();

        await templateService.apiHandler({
          methodName: "getDeals",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsDealController_createDeal: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "DealCreateRequest" },
  };
  app.post(
    "/api/v1/deals",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(DealController),
    ...fetchMiddlewares<RequestHandler>(DealController.prototype.createDeal),

    async function DealController_createDeal(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsDealController_createDeal,
          request,
          response,
        });

        const controller = new DealController();

        await templateService.apiHandler({
          methodName: "createDeal",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsContactController_getContacts: Record<string, TsoaRoute.ParameterSchema> = {
    _page: { default: 1, in: "query", name: "_page", dataType: "double" },
    _limit: { default: 20, in: "query", name: "_limit", dataType: "double" },
    _type: { in: "query", name: "_type", dataType: "string" },
  };
  app.get(
    "/api/v1/contacts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(ContactController),
    ...fetchMiddlewares<RequestHandler>(ContactController.prototype.getContacts),

    async function ContactController_getContacts(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsContactController_getContacts,
          request,
          response,
        });

        const controller = new ContactController();

        await templateService.apiHandler({
          methodName: "getContacts",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsContactController_createContact: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "ContactCreateRequest" },
  };
  app.post(
    "/api/v1/contacts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(ContactController),
    ...fetchMiddlewares<RequestHandler>(ContactController.prototype.createContact),

    async function ContactController_createContact(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsContactController_createContact,
          request,
          response,
        });

        const controller = new ContactController();

        await templateService.apiHandler({
          methodName: "createContact",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "LoginRequest" },
  };
  app.post(
    "/api/v1/auth/login",
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.login),

    async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_login,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: "login",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_register: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "RegisterRequest" },
  };
  app.post(
    "/api/v1/auth/register",
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.register),

    async function AuthController_register(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_register,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: "register",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAuthController_logout: Record<string, TsoaRoute.ParameterSchema> = {};
  app.post(
    "/api/v1/auth/logout",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(AuthController),
    ...fetchMiddlewares<RequestHandler>(AuthController.prototype.logout),

    async function AuthController_logout(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_logout,
          request,
          response,
        });

        const controller = new AuthController();

        await templateService.apiHandler({
          methodName: "logout",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 200,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAccountController_getAccounts: Record<string, TsoaRoute.ParameterSchema> = {
    _type: { in: "query", name: "_type", dataType: "string" },
  };
  app.get(
    "/api/v1/accounts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(AccountController),
    ...fetchMiddlewares<RequestHandler>(AccountController.prototype.getAccounts),

    async function AccountController_getAccounts(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAccountController_getAccounts,
          request,
          response,
        });

        const controller = new AccountController();

        await templateService.apiHandler({
          methodName: "getAccounts",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: undefined,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  const argsAccountController_createAccount: Record<string, TsoaRoute.ParameterSchema> = {
    _request: { in: "body", name: "_request", required: true, ref: "AccountCreateRequest" },
  };
  app.post(
    "/api/v1/accounts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares<RequestHandler>(AccountController),
    ...fetchMiddlewares<RequestHandler>(AccountController.prototype.createAccount),

    async function AccountController_createAccount(request: ExRequest, response: ExResponse, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      let validatedArgs: any[] = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAccountController_createAccount,
          request,
          response,
        });

        const controller = new AccountController();

        await templateService.apiHandler({
          methodName: "createAccount",
          controller,
          response,
          next,
          validatedArgs,
          successStatus: 201,
        });
      } catch (err) {
        return next(err);
      }
    },
  );
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

  function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
    return async function runAuthenticationMiddleware(request: any, response: any, next: any) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts: any[] = [];
      const pushAndRethrow = (error: any) => {
        failedAttempts.push(error);
        throw error;
      };

      const secMethodOrPromises: Promise<any>[] = [];
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises: Promise<any>[] = [];

          for (const name in secMethod) {
            secMethodAndPromises.push(
              expressAuthenticationRecasted(request, name, secMethod[name], response).catch(pushAndRethrow),
            );
          }

          // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

          secMethodOrPromises.push(
            Promise.all(secMethodAndPromises).then((users) => {
              return users[0];
            }),
          );
        } else {
          for (const name in secMethod) {
            secMethodOrPromises.push(
              expressAuthenticationRecasted(request, name, secMethod[name], response).catch(pushAndRethrow),
            );
          }
        }
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

      try {
        request["user"] = await Promise.any(secMethodOrPromises);

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }

        next();
      } catch (err) {
        // Show most recent error as response
        const error = failedAttempts.pop();
        error.status = error.status || 401;

        // Response was sent in middleware, abort
        if (response.writableEnded) {
          return;
        }
        next(error);
      }

      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    };
  }

  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
