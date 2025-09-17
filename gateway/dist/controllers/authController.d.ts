import { Controller } from "tsoa";
interface LoginRequest {
  email: string;
  password: string;
}
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
  };
}
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  subdomain: string;
}
export declare class AuthController extends Controller {
  login(request: LoginRequest): Promise<LoginResponse>;
  register(request: RegisterRequest): Promise<LoginResponse>;
  refresh(): Promise<{
    token: string;
  }>;
}
export {};
//# sourceMappingURL=authController.d.ts.map
