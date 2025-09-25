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
