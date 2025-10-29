import type { DataProxyService } from "./data-proxy.service.js";

export interface FieldMapping {
  sourceColumn: string;
  targetField: string;
  transform?: "lowercase" | "uppercase" | "trim" | "date" | "number" | "boolean";
  defaultValue?: unknown;
}

export interface TableMapping {
  id: string;
  connectorId: string;
  sourceSchema: string;
  sourceTable: string;
  targetEntity: "contact" | "deal" | "company" | "invoice" | "employee" | "custom";
  fieldMappings: FieldMapping[];
  filters?: Record<string, unknown>;
  syncEnabled: boolean;
  syncFrequency?: "manual" | "hourly" | "daily" | "weekly";
  lastSyncAt?: Date;
}

/**
 * Data Mapper Service
 * Maps external database tables to Safee CRM entities
 */
export class DataMapperService {
  constructor(private dataProxyService: DataProxyService) {}

  /**
   * Get suggested field mappings based on column names
   */
  suggestMappings(sourceColumns: string[], targetEntity: TableMapping["targetEntity"]): FieldMapping[] {
    const mappings: FieldMapping[] = [];

    // Common mappings for contacts/customers
    const contactMappings: Record<string, string> = {
      id: "externalId",
      customer_id: "externalId",
      client_id: "externalId",
      name: "name",
      full_name: "name",
      customer_name: "name",
      first_name: "firstName",
      last_name: "lastName",
      email: "email",
      email_address: "email",
      phone: "phone",
      phone_number: "phone",
      mobile: "mobile",
      company: "company",
      company_name: "company",
      organization: "company",
      address: "address",
      street: "street",
      city: "city",
      state: "state",
      country: "country",
      zip: "postalCode",
      zipcode: "postalCode",
      postal_code: "postalCode",
      notes: "notes",
      description: "description",
      created_at: "createdAt",
      updated_at: "updatedAt",
      status: "status",
    };

    // Common mappings for deals/opportunities
    const dealMappings: Record<string, string> = {
      id: "externalId",
      deal_id: "externalId",
      opportunity_id: "externalId",
      title: "title",
      name: "title",
      deal_name: "title",
      value: "value",
      amount: "value",
      deal_value: "value",
      currency: "currency",
      stage: "stage",
      status: "status",
      probability: "probability",
      close_date: "closeDate",
      expected_close: "closeDate",
      owner: "ownerId",
      assigned_to: "ownerId",
      customer_id: "contactId",
      contact_id: "contactId",
      notes: "notes",
      description: "description",
      created_at: "createdAt",
      updated_at: "updatedAt",
    };

    // Common mappings for employees
    const employeeMappings: Record<string, string> = {
      id: "externalId",
      employee_id: "externalId",
      emp_id: "externalId",
      first_name: "firstName",
      last_name: "lastName",
      full_name: "name",
      email: "email",
      phone: "phone",
      department: "department",
      position: "position",
      title: "jobTitle",
      job_title: "jobTitle",
      salary: "salary",
      hire_date: "hireDate",
      start_date: "hireDate",
      manager_id: "managerId",
      status: "status",
      created_at: "createdAt",
      updated_at: "updatedAt",
    };

    // Common mappings for invoices
    const invoiceMappings: Record<string, string> = {
      id: "externalId",
      invoice_id: "externalId",
      invoice_number: "invoiceNumber",
      invoice_no: "invoiceNumber",
      customer_id: "contactId",
      client_id: "contactId",
      amount: "amount",
      total: "amount",
      total_amount: "amount",
      subtotal: "subtotal",
      tax: "tax",
      currency: "currency",
      due_date: "dueDate",
      payment_date: "paidDate",
      paid_date: "paidDate",
      status: "status",
      payment_status: "status",
      notes: "notes",
      description: "description",
      created_at: "createdAt",
      issued_date: "createdAt",
    };

    const mappingsByEntity: Record<string, Record<string, string>> = {
      contact: contactMappings,
      deal: dealMappings,
      employee: employeeMappings,
      invoice: invoiceMappings,
      company: contactMappings, // Similar to contacts
    };

    const entityMappings = mappingsByEntity[targetEntity] || {};

    // Try to match columns
    for (const column of sourceColumns) {
      const normalizedColumn = column.toLowerCase().replace(/[_\s-]/g, "_");
      const targetField = entityMappings[normalizedColumn];

      if (targetField) {
        const mapping: FieldMapping = {
          sourceColumn: column,
          targetField,
        };

        // Add transforms based on target field type
        if (targetField.includes("email")) {
          mapping.transform = "lowercase";
        } else if (targetField.includes("Date") || targetField.includes("At")) {
          mapping.transform = "date";
        } else if (targetField === "value" || targetField === "amount" || targetField === "salary") {
          mapping.transform = "number";
        }

        mappings.push(mapping);
      }
    }

    return mappings;
  }

  /**
   * Transform data according to field mappings
   */
  transformRow(sourceRow: Record<string, unknown>, mappings: FieldMapping[]): Record<string, unknown> {
    const transformed: Record<string, unknown> = {};

    for (const mapping of mappings) {
      let value = sourceRow[mapping.sourceColumn];

      // Apply default value if source is null/undefined
      if (value === null || value === undefined) {
        if (mapping.defaultValue !== undefined) {
          value = mapping.defaultValue;
        } else {
          continue;
        }
      }

      // Apply transform
      if (mapping.transform && value !== null && value !== undefined) {
        switch (mapping.transform) {
          case "lowercase":
            value = String(value).toLowerCase();
            break;
          case "uppercase":
            value = String(value).toUpperCase();
            break;
          case "trim":
            value = String(value).trim();
            break;
          case "date":
            if (typeof value === "string" || typeof value === "number") {
              value = new Date(value);
            }
            break;
          case "number":
            value = Number(value);
            break;
          case "boolean":
            value = Boolean(value);
            break;
        }
      }

      transformed[mapping.targetField] = value;
    }

    return transformed;
  }

  /**
   * Fetch and transform data from external table
   */
  async fetchMappedData<T = unknown>(
    organizationId: string,
    mapping: TableMapping,
    options?: {
      limit?: number;
      offset?: number;
      where?: Record<string, unknown>;
    },
  ): Promise<{ data: T[]; total: number }> {
    // Get raw data from external database
    const result = await this.dataProxyService.executePaginatedQuery(organizationId, mapping.connectorId, {
      schema: mapping.sourceSchema,
      table: mapping.sourceTable,
      where: { ...mapping.filters, ...options?.where },
      limit: options?.limit || 100,
      offset: options?.offset || 0,
    });

    // Transform each row - rows are unknown, need to assert as Record for transform
    const transformedData = result.rows.map((row) =>
      this.transformRow(row as Record<string, unknown>, mapping.fieldMappings),
    ) as T[];

    return {
      data: transformedData,
      total: result.total,
    };
  }

  /**
   * Preview mapped data (shows both source and target)
   */
  async previewMapping(
    organizationId: string,
    mapping: TableMapping,
    limit: number = 10,
  ): Promise<
    Array<{
      source: Record<string, unknown>;
      target: Record<string, unknown>;
    }>
  > {
    const result = await this.dataProxyService.executePaginatedQuery(organizationId, mapping.connectorId, {
      schema: mapping.sourceSchema,
      table: mapping.sourceTable,
      where: mapping.filters,
      limit,
      offset: 0,
    });

    return result.rows.map((source) => ({
      source: source as Record<string, unknown>,
      target: this.transformRow(source as Record<string, unknown>, mapping.fieldMappings),
    }));
  }

  /**
   * Validate mapping configuration
   */
  async validateMapping(
    organizationId: string,
    mapping: TableMapping,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if connector exists and is accessible
    try {
      const schema = await this.dataProxyService.getSchema(organizationId, mapping.connectorId);

      // Check if source table exists
      const tableExists = schema.tables.some(
        (t: { schema: string; name: string }) =>
          t.schema === mapping.sourceSchema && t.name === mapping.sourceTable,
      );

      if (!tableExists) {
        errors.push(`Table ${mapping.sourceSchema}.${mapping.sourceTable} not found in connector`);
        return { valid: false, errors, warnings };
      }

      // Get actual columns
      const preview = await this.dataProxyService.getTablePreview(
        organizationId,
        mapping.connectorId,
        mapping.sourceSchema,
        mapping.sourceTable,
        1,
      );

      const actualColumns = preview.columns.map((c: { name: string }) => c.name);

      // Validate field mappings
      for (const fieldMapping of mapping.fieldMappings) {
        if (!actualColumns.includes(fieldMapping.sourceColumn)) {
          errors.push(`Source column '${fieldMapping.sourceColumn}' not found in table`);
        }
      }

      // Check for unmapped columns
      const mappedColumns = mapping.fieldMappings.map((m: FieldMapping) => m.sourceColumn);
      const unmappedColumns = actualColumns.filter((col: string) => !mappedColumns.includes(col));

      if (unmappedColumns.length > 0) {
        warnings.push(
          `${unmappedColumns.length} columns are not mapped: ${unmappedColumns.slice(0, 5).join(", ")}${
            unmappedColumns.length > 5 ? "..." : ""
          }`,
        );
      }
    } catch (error) {
      errors.push(`Failed to validate mapping: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
