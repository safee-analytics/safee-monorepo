"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Eye, EyeOff, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";

interface APIKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: "active" | "revoked";
  permissions: string[];
}

export default function APIKeysSettings() {
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "1",
      name: "Production API",
      key: "sk_live_abc123xyz789def456ghi012jkl",
      created: "2024-01-15",
      lastUsed: "2 hours ago",
      status: "active",
      permissions: ["read", "write"],
    },
    {
      id: "2",
      name: "Development API",
      key: "sk_test_xyz789abc123def456ghi012jkl",
      created: "2024-01-10",
      lastUsed: "5 days ago",
      status: "active",
      permissions: ["read"],
    },
    {
      id: "3",
      name: "Legacy Integration",
      key: "sk_live_old123key456revoked789xyz",
      created: "2023-12-01",
      lastUsed: "30 days ago",
      status: "revoked",
      permissions: ["read", "write"],
    },
  ]);

  const availablePermissions = [
    { id: "read", name: "Read", description: "View data and resources" },
    { id: "write", name: "Write", description: "Create and update resources" },
    { id: "delete", name: "Delete", description: "Delete resources" },
    { id: "admin", name: "Admin", description: "Full administrative access" },
  ];

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

  const createAPIKey = () => {
    if (!newKeyName.trim()) {
      alert("Please enter a name for the API key");
      return;
    }
    if (newKeyPermissions.length === 0) {
      alert("Please select at least one permission");
      return;
    }

    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "active",
      permissions: newKeyPermissions,
    };

    setApiKeys([newKey, ...apiKeys]);
    setShowCreateModal(false);
    setNewKeyName("");
    setNewKeyPermissions([]);
  };

  const revokeKey = (keyId: string) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      setApiKeys(apiKeys.map((key) => (key.id === keyId ? { ...key, status: "revoked" as const } : key)));
    }
  };

  const deleteKey = (keyId: string) => {
    if (confirm("Are you sure you want to permanently delete this API key?")) {
      setApiKeys(apiKeys.filter((key) => key.id !== keyId));
    }
  };

  const togglePermission = (permission: string) => {
    if (newKeyPermissions.includes(permission)) {
      setNewKeyPermissions(newKeyPermissions.filter((p) => p !== permission));
    } else {
      setNewKeyPermissions([...newKeyPermissions, permission]);
    }
  };

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
                Create API Key
              </button>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Keep your API keys secure</p>
              <p className="text-sm text-yellow-700 mt-1">
                Never share your API keys publicly or commit them to version control. Anyone with your API key
                can access your data.
              </p>
            </div>
          </div>

          {/* API Keys List */}
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
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
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Active</span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Revoked</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Created: {apiKey.created}</p>
                      <p>Last used: {apiKey.lastUsed}</p>
                      <div className="flex items-center gap-2">
                        <span>Permissions:</span>
                        {apiKey.permissions.map((permission) => (
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
                        onClick={() => revokeKey(apiKey.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                    <button
                      onClick={() => deleteKey(apiKey.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
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
                        title={revealedKeys.has(apiKey.id) ? "Hide" : "Reveal"}
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
                        title="Copy to clipboard"
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
                <p className="text-gray-600 mb-4">No API keys created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create your first API key
                </button>
              </div>
            )}
          </div>

          {/* Documentation */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
            <p className="text-sm text-gray-600 mb-4">
              Learn how to use the Safee API to integrate with your applications.
            </p>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View API Documentation →
            </a>
          </div>

          {/* Create API Key Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create API Key</h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production API"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                    <div className="space-y-2">
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{permission.name}</p>
                            <p className="text-sm text-gray-500">{permission.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName("");
                      setNewKeyPermissions([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createAPIKey}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Key
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </SettingsPermissionGate>
  );
}
