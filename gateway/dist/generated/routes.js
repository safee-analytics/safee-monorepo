import { fetchMiddlewares, ExpressTemplateService } from "@tsoa/runtime";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { PayrollController } from "./../controllers/payrollController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { InvoiceController } from "./../controllers/invoiceController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HisabiqController } from "./../controllers/hisabiqController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from "./../controllers/healthController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EmployeeController } from "./../controllers/employeeController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { DealController } from "./../controllers/dealController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContactController } from "./../controllers/contactController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from "./../controllers/authController";
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AccountController } from "./../controllers/accountController";
import { expressAuthentication } from "./../middleware/authentication";
const expressAuthenticationRecasted = expressAuthentication;
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
const models = {
  PayrollRecord: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      employeeId: { dataType: "string", required: true },
      payPeriod: { dataType: "string", required: true },
      baseSalary: { dataType: "double", required: true },
      netPay: { dataType: "double", required: true },
      payDate: { dataType: "string", required: true },
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
  HealthResponse: {
    dataType: "refObject",
    properties: {
      status: { dataType: "string", required: true },
      timestamp: { dataType: "string", required: true },
      version: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Employee: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      employeeId: { dataType: "string", required: true },
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string" },
      department: { dataType: "string" },
      position: { dataType: "string" },
      salary: { dataType: "double" },
      status: { dataType: "string", required: true },
      hireDate: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  EmployeeCreateRequest: {
    dataType: "refObject",
    properties: {
      employeeId: { dataType: "string", required: true },
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string" },
      phone: { dataType: "string" },
      hireDate: { dataType: "string", required: true },
      department: { dataType: "string" },
      position: { dataType: "string" },
      salary: { dataType: "double" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Deal: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      title: { dataType: "string", required: true },
      value: { dataType: "double" },
      stage: { dataType: "string", required: true },
      probability: { dataType: "double" },
      expectedCloseDate: { dataType: "string" },
      contactId: { dataType: "string" },
      createdAt: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  DealCreateRequest: {
    dataType: "refObject",
    properties: {
      title: { dataType: "string", required: true },
      value: { dataType: "double" },
      stage: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["LEAD"] },
          { dataType: "enum", enums: ["QUALIFIED"] },
          { dataType: "enum", enums: ["PROPOSAL"] },
          { dataType: "enum", enums: ["NEGOTIATION"] },
          { dataType: "enum", enums: ["CLOSED_WON"] },
          { dataType: "enum", enums: ["CLOSED_LOST"] },
        ],
        required: true,
      },
      probability: { dataType: "double" },
      expectedCloseDate: { dataType: "string" },
      contactId: { dataType: "string" },
      notes: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  Contact: {
    dataType: "refObject",
    properties: {
      id: { dataType: "string", required: true },
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string" },
      phone: { dataType: "string" },
      company: { dataType: "string" },
      type: { dataType: "string", required: true },
      source: { dataType: "string" },
      createdAt: { dataType: "string", required: true },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  ContactCreateRequest: {
    dataType: "refObject",
    properties: {
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      email: { dataType: "string" },
      phone: { dataType: "string" },
      company: { dataType: "string" },
      type: {
        dataType: "union",
        subSchemas: [
          { dataType: "enum", enums: ["LEAD"] },
          { dataType: "enum", enums: ["PROSPECT"] },
          { dataType: "enum", enums: ["CUSTOMER"] },
          { dataType: "enum", enums: ["SUPPLIER"] },
        ],
        required: true,
      },
      source: { dataType: "string" },
      notes: { dataType: "string" },
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
          organizationId: { dataType: "string", required: true },
          role: { dataType: "string", required: true },
          lastName: { dataType: "string", required: true },
          firstName: { dataType: "string", required: true },
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
      firstName: { dataType: "string", required: true },
      lastName: { dataType: "string", required: true },
      organizationName: { dataType: "string", required: true },
      subdomain: { dataType: "string", required: true },
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
      type: { dataType: "string", required: true },
      parentId: { dataType: "string" },
    },
    additionalProperties: false,
  },
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {
  noImplicitAdditionalProperties: "throw-on-extras",
  bodyCoercion: true,
});
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
export function RegisterRoutes(app) {
  // ###########################################################################################################
  //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
  //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
  // ###########################################################################################################
  const argsPayrollController_getPayrollRecords = {
    employeeId: { in: "query", name: "employeeId", dataType: "string" },
    payPeriod: { in: "query", name: "payPeriod", dataType: "string" },
  };
  app.get(
    "/api/v1/payroll",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(PayrollController),
    ...fetchMiddlewares(PayrollController.prototype.getPayrollRecords),
    async function PayrollController_getPayrollRecords(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsPayrollController_generatePayroll = {
    request: {
      in: "body",
      name: "request",
      required: true,
      dataType: "nestedObjectLiteral",
      nestedProperties: { payPeriod: { dataType: "string", required: true } },
    },
  };
  app.post(
    "/api/v1/payroll/generate",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(PayrollController),
    ...fetchMiddlewares(PayrollController.prototype.generatePayroll),
    async function PayrollController_generatePayroll(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsPayrollController_generatePayroll,
          request,
          response,
        });
        const controller = new PayrollController();
        await templateService.apiHandler({
          methodName: "generatePayroll",
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
  const argsInvoiceController_getInvoices = {
    page: { default: 1, in: "query", name: "page", dataType: "double" },
    limit: { default: 20, in: "query", name: "limit", dataType: "double" },
  };
  app.get(
    "/api/v1/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(InvoiceController),
    ...fetchMiddlewares(InvoiceController.prototype.getInvoices),
    async function InvoiceController_getInvoices(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsInvoiceController_createInvoice = {
    request: { in: "body", name: "request", required: true, ref: "InvoiceCreateRequest" },
  };
  app.post(
    "/api/v1/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(InvoiceController),
    ...fetchMiddlewares(InvoiceController.prototype.createInvoice),
    async function InvoiceController_createInvoice(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsHisabiqController_getInvoices = {
    page: { default: 1, in: "query", name: "page", dataType: "double" },
    limit: { default: 20, in: "query", name: "limit", dataType: "double" },
  };
  app.get(
    "/api/v1/hisabiq/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(HisabiqController),
    ...fetchMiddlewares(HisabiqController.prototype.getInvoices),
    async function HisabiqController_getInvoices(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsHisabiqController_createInvoice = {
    request: { in: "body", name: "request", required: true, ref: "InvoiceCreateRequest" },
  };
  app.post(
    "/api/v1/hisabiq/invoices",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(HisabiqController),
    ...fetchMiddlewares(HisabiqController.prototype.createInvoice),
    async function HisabiqController_createInvoice(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsHisabiqController_getAccounts = {};
  app.get(
    "/api/v1/hisabiq/accounts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(HisabiqController),
    ...fetchMiddlewares(HisabiqController.prototype.getAccounts),
    async function HisabiqController_getAccounts(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsHealthController_getHealth = {};
  app.get(
    "/api/v1/health",
    ...fetchMiddlewares(HealthController),
    ...fetchMiddlewares(HealthController.prototype.getHealth),
    async function HealthController_getHealth(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsEmployeeController_getEmployees = {
    page: { default: 1, in: "query", name: "page", dataType: "double" },
    limit: { default: 20, in: "query", name: "limit", dataType: "double" },
  };
  app.get(
    "/api/v1/employees",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(EmployeeController),
    ...fetchMiddlewares(EmployeeController.prototype.getEmployees),
    async function EmployeeController_getEmployees(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsEmployeeController_createEmployee = {
    request: { in: "body", name: "request", required: true, ref: "EmployeeCreateRequest" },
  };
  app.post(
    "/api/v1/employees",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(EmployeeController),
    ...fetchMiddlewares(EmployeeController.prototype.createEmployee),
    async function EmployeeController_createEmployee(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsDealController_getDeals = {
    page: { default: 1, in: "query", name: "page", dataType: "double" },
    limit: { default: 20, in: "query", name: "limit", dataType: "double" },
    stage: { in: "query", name: "stage", dataType: "string" },
  };
  app.get(
    "/api/v1/deals",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(DealController),
    ...fetchMiddlewares(DealController.prototype.getDeals),
    async function DealController_getDeals(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsDealController_createDeal = {
    request: { in: "body", name: "request", required: true, ref: "DealCreateRequest" },
  };
  app.post(
    "/api/v1/deals",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(DealController),
    ...fetchMiddlewares(DealController.prototype.createDeal),
    async function DealController_createDeal(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsContactController_getContacts = {
    page: { default: 1, in: "query", name: "page", dataType: "double" },
    limit: { default: 20, in: "query", name: "limit", dataType: "double" },
    type: { in: "query", name: "type", dataType: "string" },
  };
  app.get(
    "/api/v1/contacts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(ContactController),
    ...fetchMiddlewares(ContactController.prototype.getContacts),
    async function ContactController_getContacts(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsContactController_createContact = {
    request: { in: "body", name: "request", required: true, ref: "ContactCreateRequest" },
  };
  app.post(
    "/api/v1/contacts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(ContactController),
    ...fetchMiddlewares(ContactController.prototype.createContact),
    async function ContactController_createContact(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsAuthController_login = {
    request: { in: "body", name: "request", required: true, ref: "LoginRequest" },
  };
  app.post(
    "/api/v1/auth/login",
    ...fetchMiddlewares(AuthController),
    ...fetchMiddlewares(AuthController.prototype.login),
    async function AuthController_login(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsAuthController_register = {
    request: { in: "body", name: "request", required: true, ref: "RegisterRequest" },
  };
  app.post(
    "/api/v1/auth/register",
    ...fetchMiddlewares(AuthController),
    ...fetchMiddlewares(AuthController.prototype.register),
    async function AuthController_register(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  const argsAuthController_refresh = {};
  app.post(
    "/api/v1/auth/refresh",
    ...fetchMiddlewares(AuthController),
    ...fetchMiddlewares(AuthController.prototype.refresh),
    async function AuthController_refresh(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
      try {
        validatedArgs = templateService.getValidatedArgs({
          args: argsAuthController_refresh,
          request,
          response,
        });
        const controller = new AuthController();
        await templateService.apiHandler({
          methodName: "refresh",
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
  const argsAccountController_getAccounts = {};
  app.get(
    "/api/v1/accounts",
    authenticateMiddleware([{ jwt: [] }]),
    ...fetchMiddlewares(AccountController),
    ...fetchMiddlewares(AccountController.prototype.getAccounts),
    async function AccountController_getAccounts(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      let validatedArgs = [];
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
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
  function authenticateMiddleware(security = []) {
    return async function runAuthenticationMiddleware(request, response, next) {
      // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
      // keep track of failed auth attempts so we can hand back the most
      // recent one.  This behavior was previously existing so preserving it
      // here
      const failedAttempts = [];
      const pushAndRethrow = (error) => {
        failedAttempts.push(error);
        throw error;
      };
      const secMethodOrPromises = [];
      for (const secMethod of security) {
        if (Object.keys(secMethod).length > 1) {
          const secMethodAndPromises = [];
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
//# sourceMappingURL=routes.js.map
