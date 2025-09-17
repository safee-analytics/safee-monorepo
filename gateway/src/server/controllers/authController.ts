import { Controller, Post, Route, Tags, Body, Security, SuccessResponse } from "tsoa";

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

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
  @Post("login")
  @SuccessResponse("200", "Login successful")
  public async login(@Body() request: LoginRequest): Promise<LoginResponse> {
    throw new Error("Not implemented yet");
  }

  @Post("register")
  @SuccessResponse("201", "User registered successfully")
  public async register(@Body() request: RegisterRequest): Promise<LoginResponse> {
    throw new Error("Not implemented yet");
  }

  @Post("logout")
  @Security("jwt")
  @SuccessResponse("200", "Logout successful")
  public async logout(): Promise<{ message: string }> {
    throw new Error("Not implemented yet");
  }
}
