var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? (desc = Object.getOwnPropertyDescriptor(target, key)) : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i])) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
  };
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
import { Controller, Get, Post, Route, Tags, Security, Query, Body, SuccessResponse } from "tsoa";
let InvoiceController = class InvoiceController extends Controller {
  /**
   * Get all invoices for the authenticated user's organization
   */
  async getInvoices(page = 1, limit = 20) {
    // TODO: Implement get invoices logic
    throw new Error("Not implemented yet");
  }
  /**
   * Create a new invoice
   */
  async createInvoice(request) {
    // TODO: Implement create invoice logic
    throw new Error("Not implemented yet");
  }
};
__decorate(
  [
    Get("/"),
    Security("jwt"),
    __param(0, Query()),
    __param(1, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise),
  ],
  InvoiceController.prototype,
  "getInvoices",
  null,
);
__decorate(
  [
    Post("/"),
    Security("jwt"),
    SuccessResponse("201", "Invoice created successfully"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  InvoiceController.prototype,
  "createInvoice",
  null,
);
InvoiceController = __decorate([Route("invoices"), Tags("Invoices")], InvoiceController);
export { InvoiceController };
//# sourceMappingURL=invoiceController.js.map
