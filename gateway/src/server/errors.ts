export abstract class ApiError extends Error {
  abstract code: string;
  statusCode = 500;
  context: Record<string, unknown>;

  constructor(
    message: string,
    context: Record<string, unknown> = {},
    opts: ErrorOptions | undefined = undefined,
  ) {
    super(message, opts);
    this.context = context;
  }
}

export class CustomError extends ApiError {
  override code: string;

  constructor(
    code: string,
    statusCode: number,
    message: string,
    context: Record<string, unknown> = {},
    opts: ErrorOptions | undefined = undefined,
  ) {
    super(message, context, opts);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class BadRequest extends ApiError {
  override code = "Bad Request";
  override statusCode = 400;
}

export class Unauthorized extends ApiError {
  override code = "Unauthorized";
  override statusCode = 401;
}

export class Forbidden extends ApiError {
  override code = "Forbidden";
  override statusCode = 403;
}

export class NotFound extends ApiError {
  override code = "Not Found";
  override statusCode = 404;
}

export class MethodNotAllowed extends ApiError {
  override code = "Method Not Allowed";
  override statusCode = 405;
}

export class Conflict extends ApiError {
  override code = "Conflict";
  override statusCode = 409;
}

export class RateLimitExceeded extends ApiError {
  override code = "Rate Limit Exceeded";
  override statusCode = 429;
}

export class BadGateway extends ApiError {
  override code = "Bad Gateway";
  override statusCode = 502;
}

export class InvalidValueError extends BadRequest {
  override code = "InvalidValue";

  constructor(entityName: string, opts?: ErrorOptions) {
    super(`${entityName} must be a non-negative integer.`, { entityName }, opts);
  }
}

export class InvalidDateError extends BadRequest {
  override code = "InvalidDate";

  constructor(entityName: string, opts?: ErrorOptions) {
    super(
      `${entityName} must be a valid date. Please provide date in ISO 8601 format (e.g., "2023-11-15T14:30:00Z")`,
      { entityName },
      opts,
    );
  }
}

export class ExceedsMaximumError extends BadRequest {
  override code = "ExceedsMaximum";

  constructor(entityName: string, maxValue: number, opts?: ErrorOptions) {
    super(`${entityName} cannot exceed the maximum value of ${maxValue}.`, { entityName, maxValue }, opts);
  }
}

export class BelowMinimumError extends BadRequest {
  override code = "BelowMinimum";

  constructor(entityName: string, opts?: ErrorOptions) {
    super(`${entityName} cannot be less than 0.`, { entityName }, opts);
  }
}

export class NoTokenProvided extends Unauthorized {
  override code = "NoTokenProvided";

  constructor(opts?: ErrorOptions) {
    super("No token provided", {}, opts);
  }
}

export class InvalidToken extends Unauthorized {
  override code = "InvalidToken";

  constructor(opts?: ErrorOptions) {
    super("Invalid token", {}, opts);
  }
}

export class TokenExpired extends Unauthorized {
  override code = "TokenExpired";

  constructor(opts?: ErrorOptions) {
    super("Token expired", {}, opts);
  }
}

export class InvalidCredentials extends Unauthorized {
  override code = "InvalidCredentials";

  constructor(message = "Invalid credentials", opts?: ErrorOptions) {
    super(message, {}, opts);
  }
}

export class InsufficientPermissions extends Forbidden {
  override code = "InsufficientPermissions";

  constructor(message = "Insufficient permissions", opts?: ErrorOptions) {
    super(message, {}, opts);
  }
}

export class InvalidInput extends BadRequest {
  override code = "InvalidInput";

  constructor(message: string, opts?: ErrorOptions) {
    super(message, {}, opts);
  }
}

export class InsufficientRoles extends Forbidden {
  override code = "InsufficientRoles";

  constructor(opts?: ErrorOptions) {
    super("Insufficient roles", {}, opts);
  }
}

export class UnknownSecurityScheme extends Unauthorized {
  override code = "UnknownSecurityScheme";

  constructor(schemeName: string, opts?: ErrorOptions) {
    super(`Unknown security scheme: ${schemeName}`, { schemeName }, opts);
  }
}

export class UserNotFound extends NotFound {
  override code = "UserNotFound";

  constructor(opts?: ErrorOptions) {
    super("User not found", {}, opts);
  }
}

export class OrganizationNotFound extends NotFound {
  override code = "OrganizationNotFound";

  constructor(opts?: ErrorOptions) {
    super("Organization not found", {}, opts);
  }
}

export class SessionNotFound extends NotFound {
  override code = "SessionNotFound";

  constructor(opts?: ErrorOptions) {
    super("Session not found", {}, opts);
  }
}

export class RoleNotFound extends NotFound {
  override code = "RoleNotFound";

  constructor(roleName: string, opts?: ErrorOptions) {
    super(`Role not found: ${roleName}`, { roleName }, opts);
  }
}

export class ServiceNotFound extends NotFound {
  override code = "ServiceNotFound";

  constructor(serviceId: string, opts?: ErrorOptions) {
    super(`Service not found: ${serviceId}`, { serviceId }, opts);
  }
}

export class OdooDatabaseNotFound extends NotFound {
  override code = "OdooDatabaseNotFound";

  constructor(organizationId: string, opts?: ErrorOptions) {
    super(`Odoo database not found for organization: ${organizationId}`, { organizationId }, opts);
  }
}

export class OdooDatabaseAlreadyExists extends Conflict {
  override code = "OdooDatabaseAlreadyExists";

  constructor(organizationId: string, opts?: ErrorOptions) {
    super(`Odoo database already exists for organization: ${organizationId}`, { organizationId }, opts);
  }
}

export class ServiceAlreadyEnabled extends Conflict {
  override code = "ServiceAlreadyEnabled";

  constructor(opts?: ErrorOptions) {
    super("Service already enabled for organization", {}, opts);
  }
}

export class PasswordValidationFailed extends BadRequest {
  override code = "PasswordValidationFailed";

  constructor(opts?: ErrorOptions) {
    super("Password does not meet security requirements", {}, opts);
  }
}

export class NotImplemented extends ApiError {
  override code = "NotImplemented";
  override statusCode = 501;

  constructor(feature?: string, opts?: ErrorOptions) {
    super(
      feature ? `${feature} not implemented yet` : "Not implemented yet",
      feature ? { feature } : {},
      opts,
    );
  }
}

export class OperationFailed extends ApiError {
  override code = "OperationFailed";
  override statusCode = 500;

  constructor(operation: string, opts?: ErrorOptions) {
    super(`${operation} failed`, { operation }, opts);
  }
}

export class AuthenticationFailed extends Unauthorized {
  override code = "AuthenticationFailed";

  constructor(reason?: string, opts?: ErrorOptions) {
    super(reason || "Authentication failed", reason ? { reason } : {}, opts);
  }
}
