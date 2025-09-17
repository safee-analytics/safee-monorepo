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
let PayrollController = class PayrollController extends Controller {
  /**
   * Get payroll records
   */
  async getPayrollRecords(employeeId, payPeriod) {
    // TODO: Implement get payroll records logic
    throw new Error("Not implemented yet");
  }
  /**
   * Generate payroll for a pay period
   */
  async generatePayroll(request) {
    // TODO: Implement payroll generation logic
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
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise),
  ],
  PayrollController.prototype,
  "getPayrollRecords",
  null,
);
__decorate(
  [
    Post("generate"),
    Security("jwt"),
    SuccessResponse("201", "Payroll generated successfully"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  PayrollController.prototype,
  "generatePayroll",
  null,
);
PayrollController = __decorate([Route("payroll"), Tags("Payroll")], PayrollController);
export { PayrollController };
//# sourceMappingURL=payrollController.js.map
