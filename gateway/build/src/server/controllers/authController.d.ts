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
        name: string;
    };
}
interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    organizationName: string;
}
export declare class AuthController extends Controller {
    login(request: LoginRequest): Promise<LoginResponse>;
    register(request: RegisterRequest): Promise<LoginResponse>;
    logout(): Promise<{
        message: string;
    }>;
}
export {};
