import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/client";
import { queryKeys } from "./queryKeys";

// Permission resources and actions
const PERMISSION_RESOURCES = [
  "invoices",
  "bills",
  "payments",
  "accounts",
  "partners",
  "employees",
  "departments",
  "contracts",
  "leaves",
  "payslips",
  "leads",
  "contacts",
  "activities",
  "cases",
  "reports",
] as const;

const PERMISSION_ACTIONS = ["read", "create", "update", "delete"] as const;

// Types
export interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface CreateAPIKeyRequest {
  name: string;
  expiresIn?: number;
  permissions: string[];
}

interface BetterAuthApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastRequest: string | null;
  enabled: boolean;
  metadata?: string | { permissions?: string[] };
  permissions?: string | string[];
}

// Get all API keys (using better-auth)
export function useGetAPIKeys() {
  return useQuery<APIKey[]>({
    queryKey: queryKeys.apiKeys.all,
    queryFn: async () => {
      const { data, error } = await authClient.apiKey.list();
      if (error) throw new Error(error.message);

      // Transform better-auth format to our APIKey type
      const keysData = data?.keys;
      const keys = Array.isArray(keysData) ? keysData : [];
      return keys.map((key: BetterAuthApiKey) => {
        let permissions: string[] = [];
        try {
          if (key.metadata) {
            const metadata = typeof key.metadata === "string" ? JSON.parse(key.metadata) : key.metadata;
            permissions = metadata.permissions || [];
          } else if (key.permissions) {
            permissions = typeof key.permissions === "string" ? JSON.parse(key.permissions) : key.permissions;
          }
        } catch (err) {
          console.error("Failed to parse permissions:", err);
        }

        return {
          id: key.id,
          name: key.name || "Unnamed Key",
          key: key.key,
          created: key.createdAt,
          lastUsed: key.lastRequest || "Never",
          status: key.enabled ? "active" : "revoked",
          permissions,
        };
      });
    },
  });
}

// Get available permissions (generated from enums)
export function useGetAvailablePermissions() {
  return useQuery<Permission[]>({
    queryKey: queryKeys.apiKeys.permissions,
    queryFn: async () => {
      const permissions: Permission[] = [];

      // Generate all possible action:resource combinations
      for (const resource of PERMISSION_RESOURCES) {
        for (const action of PERMISSION_ACTIONS) {
          const id = `${action}:${resource}`;
          const name = `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;
          const description = `Allows ${action} operations on ${resource}`;

          permissions.push({ id, name, description });
        }
      }

      // Sort alphabetically by resource, then action
      permissions.sort((a, b) => {
        const [actionA, resourceA] = a.id.split(":");
        const [actionB, resourceB] = b.id.split(":");
        if (resourceA !== resourceB) {
          return resourceA.localeCompare(resourceB);
        }
        return actionA.localeCompare(actionB);
      });

      return permissions;
    },
  });
}

// Create API key (using better-auth)
export function useCreateAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAPIKeyRequest) => {
      // Store permissions in metadata as JSON string
      const { data, error } = await authClient.apiKey.create({
        name: request.name,
        expiresIn: request.expiresIn,
        metadata: JSON.stringify({
          permissions: request.permissions,
        }),
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}

// Revoke API key (using better-auth - we just delete it since there's no "revoke" endpoint)
export function useRevokeAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await authClient.apiKey.delete({
        keyId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}

// Delete API key (using better-auth)
export function useDeleteAPIKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data, error } = await authClient.apiKey.delete({
        keyId,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all });
    },
  });
}
