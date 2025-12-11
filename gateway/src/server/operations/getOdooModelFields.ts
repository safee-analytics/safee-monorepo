import { getOdooClientManager } from "../services/odoo/manager.service.js";

export async function getOdooModelFields(
  userId: string,
  organizationId: string,
  modelName: string,
  simple?: boolean,
): Promise<
  | Record<string, unknown>
  | {
      name: string;
      type: string;
      label: string;
      required?: boolean;
      readonly?: boolean;
    }[]
> {
  const client = await getOdooClientManager().getClient(userId, organizationId);
  const fields = await client.fieldsGet(modelName);

  // If simple mode, return just essential info
  if (simple) {
    return Object.entries(fields).map(([name, field]) => {
      const fieldInfo = field as Record<string, unknown>;
      return {
        name,
        type: (fieldInfo.type as string) || "unknown",
        label: (fieldInfo.string as string) || name,
        required: (fieldInfo.required as boolean) || false,
        readonly: (fieldInfo.readonly as boolean) || false,
      };
    });
  }

  return fields;
}
