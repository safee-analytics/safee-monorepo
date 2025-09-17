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
import { Body, Controller, Post, Route, Tags, SuccessResponse } from "tsoa";
let AuthController = class AuthController extends Controller {
  async login(request) {
    // TODO: Implement authentication logic
    throw new Error("Not implemented yet");
  }
  async register(request) {
    // TODO: Implement registration logic
    throw new Error("Not implemented yet");
  }
  async refresh() {
    // TODO: Implement token refresh logic
    throw new Error("Not implemented yet");
  }
};
__decorate(
  [
    Post("login"),
    SuccessResponse("200", "Login successful"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  AuthController.prototype,
  "login",
  null,
);
__decorate(
  [
    Post("register"),
    SuccessResponse("201", "Registration successful"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise),
  ],
  AuthController.prototype,
  "register",
  null,
);
__decorate(
  [
    Post("refresh"),
    SuccessResponse("200", "Token refreshed"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise),
  ],
  AuthController.prototype,
  "refresh",
  null,
);
AuthController = __decorate([Route("auth"), Tags("Authentication")], AuthController);
export { AuthController };
//# sourceMappingURL=authController.js.map
