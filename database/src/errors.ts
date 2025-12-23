export class OrganizationNotFound extends Error {
  constructor(opts?: ErrorOptions) {
    super("Organization not found", opts);
  }
}

export class OdooDatabaseNotFound extends Error {
  public organizationId: string;

  constructor(organizationId: string, opts?: ErrorOptions) {
    super(`Odoo database not found for organization: ${organizationId}`, opts);
    this.organizationId = organizationId;
  }
}

export class OdooDatabaseAlreadyExists extends Error {
  public organizationId: string;

  constructor(organizationId: string, opts?: ErrorOptions) {
    super(`Odoo database already exists for organization: ${organizationId}`, opts);
    this.organizationId = organizationId;
  }
}
