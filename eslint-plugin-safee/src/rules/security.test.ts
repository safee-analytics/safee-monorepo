import { RuleTester } from "@typescript-eslint/rule-tester";
import { rule } from "./security.js";
import { after, describe, it } from "node:test";

RuleTester.afterAll = after;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.describe = describe;
// eslint-disable-next-line @typescript-eslint/no-misused-promises
RuleTester.it = it;

const ruleTester = new RuleTester();
const messageId = "missing-security";

ruleTester.run("tsoa-security", rule, {
  invalid: [
    {
      code: `
        @Route("invoices")
        @Tags("Invoices")
        export class InvoiceController extends Controller {

        @Post("/")
        public async createInvoice(
          @Body() request: InvoiceCreateRequest,
        ): Promise<Invoice> {
          return {} as Invoice;
        }
       }
      `,
      errors: [{ messageId }],
    },
    {
      code: `
        @Route("employees")
        @Tags("Employees")
        export class EmployeeController extends Controller {

        @Get("/")
        public async getEmployees(
          @Query() page: number = 1,
          @Query() limit: number = 20,
        ): Promise<any> {
          return {};
        }
       }
      `,
      errors: [{ messageId }],
    },
  ],
  valid: [
    {
      code: `
        @Route("invoices")
        @Tags("Invoices")
        export class InvoiceController extends Controller {

        @Post("/")
        @Security("jwt")
        public async createInvoice(
          @Body() request: InvoiceCreateRequest,
        ): Promise<Invoice> {
          return {} as Invoice;
        }
       }
      `,
    },
    {
      code: `
        @Route("employees")
        @Tags("Employees")
        export class EmployeeController extends Controller {

        @Get("/")
        @Security("jwt")
        public async getEmployees(
          @Query() page: number = 1,
          @Query() limit: number = 20,
        ): Promise<any> {
          return {};
        }
       }
      `,
    },
    {
      code: `
        @Route("contacts")
        @Tags("Contacts")
        export class ContactController extends Controller {

        @Post("/")
        @NoSecurity()
        public async createContact(
          @Body() request: ContactCreateRequest,
        ): Promise<Contact> {
          return {} as Contact;
        }
       }
      `,
    },
  ],
});
