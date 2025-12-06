"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Plus, Trash2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import { useToast, useConfirm, SafeeToastContainer } from "@/components/feedback";
import {
  useGetAPIKeys,
  useGetAvailablePermissions,
  useCreateAPIKey,
  useRevokeAPIKey,
  useDeleteAPIKey,
  type APIKey,
  type Permission,
} from "@/lib/api/hooks/api-keys";

export default function APIKeysSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch data
  const { data: apiKeys = [], isLoading: keysLoading } = useGetAPIKeys();
  const { data: availablePermissions = [], isLoading: _permissionsLoading } = useGetAvailablePermissions();

  // Mutations
  const createKey = useCreateAPIKey();
  const revokeKey = useRevokeAPIKey();
  const deleteKey = useDeleteAPIKey();

  const toggleKeyVisibility = (keyId: string) => {
    const newRevealed = new Set(revealedKeys);
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId);
    } else {
      newRevealed.add(keyId);
    }
    setRevealedKeys(newRevealed);
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    const prefix = key.substring(0, 10);
    const suffix = key.substring(key.length - 4);
    return `${prefix}${"•".repeat(20)}${suffix}`;
  };

  const createAPIKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    if (newKeyPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    try {
      await createKey.mutateAsync({
        name: newKeyName,
        permissions: newKeyPermissions,
      });
      setShowCreateModal(false);
      setNewKeyName("");
      setNewKeyPermissions([]);
    } catch (_error) {
      toast.error("Failed to create API key");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
        const confirmed = await confirm({
      title: "Revoke API Key",
      message: "Are you sure you want to revoke this API key? This action cannot be undone.",
      type: "danger",
      confirmText: "Revoke",
    });
    if (confirmed) {
      try {
        await revokeKey.mutateAsync(keyId);
      } catch (_error) {
        toast.error("Failed to revoke API key");
      }
    }
  };

  const handleDeleteKey = async (keyId: string) => {
        const confirmed = await confirm({
      title: "Delete API Key",
      message: "Are you sure you want to permanently delete this API key?",
      type: "danger",
      confirmText: "Delete",
    });
    if (confirmed) {
      try {
        await deleteKey.mutateAsync(keyId);
      } catch (_error) {
        toast.error("Failed to delete API key");
      }
    }
  };

  const togglePermission = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter((p) => p !== permission));
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission]);
    }
  };

  const toggleAllResourcePermissions = (resource: string) => {
    const resourcePerms = availablePermissions
      .filter((p: Permission) => p.id.endsWith(`:${resource}`))
      .map((p: Permission) => p.id);

    const allSelected = resourcePerms.every((p: string) => newKeyPermissions.includes(p));

    if (allSelected) {
      setNewKeyPermissions(newKeyPermissions.filter((p: string) => !resourcePerms.includes(p)));
    } else {
      const newPerms = [...newKeyPermissions];
      resourcePerms.forEach((p: string) => {
        if (!newPerms.includes(p)) newPerms.push(p);
      });
      setNewKeyPermissions(newPerms);
    }
  };

  // Group permissions by resource
  const permissionsByResource = availablePermissions.reduce(
    (acc: Record<string, Array<{ action: string; id: string }>>, perm: Permission) => {
      const [action, resource] = perm.id.split(":");
      if (!acc[resource]) acc[resource] = [];
      acc[resource].push({ action, id: perm.id });
      return acc;
    },
    {} as Record<string, Array<{ action: string; id: string }>>,
  );

  return (
    <SettingsPermissionGate>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.api.title}</h1>
                <p className="text-gray-600">{t.settings.api.subtitle}</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t.settings.api.createButton}
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">{t.settings.api.warning.title}</p>
              <p className="text-sm text-yellow-700 mt-1">
                {t.settings.api.warning.message}
              </p>
            </div>
          </div>

          {/* API Keys List */}
          {keysLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey: APIKey) => (
                <div
                  key={apiKey.id}
                  className={`bg-white rounded-lg border p-5 ${
                    apiKey.status === "revoked" ? "border-red-200 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                        {apiKey.status === "active" ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                            {t.settings.api.list.active}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">{t.settings.api.list.revoked}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>{t.settings.api.list.created}: {apiKey.created}</p>
                        <p>{t.settings.api.list.lastUsed}: {apiKey.lastUsed}</p>
                        <div className="flex items-center gap-2">
                          <span>{t.settings.api.list.permissions}:</span>
                          {apiKey.permissions.map((permission: string) => (
                            <span
                              key={permission}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiKey.status === "active" && (
                        <button
                          onClick={() => handleRevokeKey(apiKey.id)}
                          disabled={revokeKey.isPending}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          {revokeKey.isPending ? t.settings.api.list.revoking : t.settings.api.list.revoke}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteKey(apiKey.id)}
                        disabled={deleteKey.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* API Key Display */}
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <code className="text-gray-100">
                        {revealedKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                          title={revealedKeys.has(apiKey.id) ? t.settings.api.list.hide : t.settings.api.list.reveal}
                        >
                          {revealedKeys.has(apiKey.id) ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                          title={t.settings.api.list.copy}
                        >
                          {copiedKey === apiKey.id ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {apiKeys.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <Key className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">{t.settings.api.empty.title}</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t.settings.api.empty.button}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documentation */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.settings.api.documentation.title}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t.settings.api.documentation.message}
            </p>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {t.settings.api.documentation.button}
            </button>
          </div>

          {/* Create API Key Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t.settings.api.createModal.title}</h2>

                <div className="space-y-4 mb-6 flex-1 overflow-y-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.api.createModal.keyName}</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={t.settings.api.createModal.keyNamePlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {t.settings.api.createModal.permissionsLabel} ({newKeyPermissions.length} {t.settings.api.createModal.permissionsSelected})
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(permissionsByResource).map(
                        ([resource, actions]: [string, Array<{ action: string; id: string }>]) => {
                          const allSelected = actions.every((a: { id: string }) =>
                            newKeyPermissions.includes(a.id),
                          );
                          const someSelected = actions.some((a: { id: string }) =>
                            newKeyPermissions.includes(a.id),
                          );

                          return (
                            <div key={resource} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900 capitalize">{resource}</h3>
                                <button
                                  onClick={() => toggleAllResourcePermissions(resource)}
                                  className={`text-xs px-2 py-1 rounded ${
                                    allSelected
                                      ? "bg-blue-600 text-white"
                                      : someSelected
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {allSelected ? t.settings.api.createModal.deselectAll : t.settings.api.createModal.selectAll}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {actions.map(({ action, id }: { action: string; id: string }) => (
                                  <label
                                    key={id}
                                    className="flex items-center gap-2 text-sm cursor-pointer group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={newKeyPermissions.includes(id)}
                                      onChange={() => togglePermission(id)}
                                      className="w-3.5 h-3.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="text-gray-700 group-hover:text-gray-900 capitalize">
                                      {action}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName("");
                      setNewKeyPermissions([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.settings.api.createModal.cancel}
                  </button>
                  <button
                    onClick={createAPIKey}
                    disabled={createKey.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createKey.isPending ? t.settings.api.createModal.creating : t.settings.api.createModal.create}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
        <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
        <ConfirmModalComponent />
      </div>
    </SettingsPermissionGate>
  );
}
