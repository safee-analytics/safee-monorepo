export class OdooError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OdooError";
  }
}

export class ValidationError extends OdooError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFound extends OdooError {
  constructor(message: string) {
    super(message);
    this.name = "NotFound";
  }
}

export class AuthenticationError extends OdooError {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class PermissionDenied extends OdooError {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDenied";
  }
}

export class OperationFailed extends OdooError {
  constructor(message: string) {
    super(message);
    this.name = "OperationFailed";
  }
}
