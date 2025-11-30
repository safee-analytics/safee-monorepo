"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, HardDrive, Wifi, AlertCircle, CheckCircle, Save, TestTube, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import {
  useGetStorageConfig,
  useUpdateStorageConfig,
  useTestStorageConnection,
  useGetStorageInfo,
  type NASConfig,
} from "@/lib/api/hooks/storage-settings";

export default function StorageSettings() {
  const { t } = useTranslation();

  // Fetch data
  const { data: storageConfig, isLoading: configLoading } = useGetStorageConfig();
  const { data: storageInfo, isLoading: infoLoading } = useGetStorageInfo();

  // Mutations
  const updateConfig = useUpdateStorageConfig();
  const testConnection = useTestStorageConnection();

  // Storage mode: managed (by us) or custom (user provides their own NAS)
  const [storageMode, setStorageMode] = useState<"managed" | "custom">("managed");

  // Local state
  const [config, setConfig] = useState<NASConfig>({
    type: "smb",
    host: "",
    shareName: "",
    username: "",
    password: "",
    domain: "",
    port: 445,
  });
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  // Update local state when data is fetched
  useEffect(() => {
    if (storageConfig) {
      setConfig(storageConfig);
    }
  }, [storageConfig]);

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    setErrorMessage("");

    try {
      await testConnection.mutateAsync(config);
      setConnectionStatus("connected");
    } catch (error) {
      setConnectionStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Connection failed");
    }
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(config);
      alert("Storage configuration saved successfully");
    } catch (_error) {
      alert("Failed to save configuration");
    }
  };

  return (
    <SettingsPermissionGate>
      <div className="min-h-screen bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t.audit.documentManagement} - Storage Configuration
            </h1>
            <p className="text-gray-600">Configure your storage solution for document management</p>
          </div>

          {/* Storage Mode Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStorageMode("managed")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  storageMode === "managed"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive
                    className={`w-5 h-5 ${storageMode === "managed" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <h3
                    className={`font-semibold ${storageMode === "managed" ? "text-blue-900" : "text-gray-900"}`}
                  >
                    Managed Storage
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  We provide secure cloud storage with automatic backups
                </p>
              </button>

              <button
                onClick={() => setStorageMode("custom")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  storageMode === "custom"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Server
                    className={`w-5 h-5 ${storageMode === "custom" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <h3
                    className={`font-semibold ${storageMode === "custom" ? "text-blue-900" : "text-gray-900"}`}
                  >
                    Custom NAS/Storage
                  </h3>
                </div>
                <p className="text-sm text-gray-600">Connect to your own NAS or network storage server</p>
              </button>
            </div>
          </div>

          {/* Show storage info for managed mode */}
          {storageMode === "managed" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Storage Information</h2>
              </div>

              {infoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : !storageInfo ? (
                <div className="text-center py-8">
                  <HardDrive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Storage information unavailable</p>
                  <p className="text-sm text-gray-400">Backend endpoint not configured yet</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Space</div>
                      <div className="text-2xl font-bold text-gray-900">{storageInfo.totalSpace}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Used Space</div>
                      <div className="text-2xl font-bold text-blue-600">{storageInfo.usedSpace}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Available</div>
                      <div className="text-2xl font-bold text-green-600">{storageInfo.availableSpace}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${storageInfo.usagePercentage}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Show config card for custom mode */}
          {storageMode === "custom" && (
            <>
              {/* Main Config Card */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Server className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Storage Connection</h2>
                </div>

                {configLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* Connection Type */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Storage Type</label>
                      <div className="grid grid-cols-4 gap-3">
                        {(["smb", "nfs", "webdav", "local"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setConfig({ ...config, type })}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              config.type === type
                                ? "border-blue-600 bg-blue-50 text-blue-700"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="font-medium uppercase text-xs">{type}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {type === "smb" && "Windows/Samba"}
                              {type === "nfs" && "Unix/Linux"}
                              {type === "webdav" && "HTTP(S)"}
                              {type === "local" && "Local Storage"}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {config.type !== "local" && (
                      <>
                        {/* Host */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Host / IP Address
                          </label>
                          <input
                            type="text"
                            value={config.host}
                            onChange={(e) => setConfig({ ...config, host: e.target.value })}
                            placeholder="192.168.1.100 or nas.example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Port */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                          <input
                            type="number"
                            value={config.port}
                            onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                            placeholder={
                              config.type === "smb" ? "445" : config.type === "nfs" ? "2049" : "443"
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Share Name */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Share Name / Path
                          </label>
                          <input
                            type="text"
                            value={config.shareName}
                            onChange={(e) => setConfig({ ...config, shareName: e.target.value })}
                            placeholder="documents or /export/share"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Username */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                          <input
                            type="text"
                            value={config.username}
                            onChange={(e) => setConfig({ ...config, username: e.target.value })}
                            placeholder="admin or domain\\user"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                          <input
                            type="password"
                            value={config.password}
                            onChange={(e) => setConfig({ ...config, password: e.target.value })}
                            placeholder="••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        {/* Domain (SMB only) */}
                        {config.type === "smb" && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Domain (Optional)
                            </label>
                            <input
                              type="text"
                              value={config.domain}
                              onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                              placeholder="WORKGROUP or DOMAIN"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Connection Status */}
                    {connectionStatus !== "idle" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-lg mb-4 ${
                          connectionStatus === "connected"
                            ? "bg-green-50 border border-green-200"
                            : connectionStatus === "error"
                              ? "bg-red-50 border border-red-200"
                              : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {connectionStatus === "testing" && (
                            <>
                              <Wifi className="w-5 h-5 text-blue-600 animate-pulse" />
                              <span className="text-blue-800">Testing connection...</span>
                            </>
                          )}
                          {connectionStatus === "connected" && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-green-800">Connected successfully!</span>
                            </>
                          )}
                          {connectionStatus === "error" && (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-600" />
                              <div>
                                <div className="text-red-800 font-medium">Connection failed</div>
                                <div className="text-red-600 text-sm">{errorMessage}</div>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleTestConnection}
                        disabled={testConnection.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <TestTube className="w-4 h-4" />
                        {testConnection.isPending ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateConfig.isPending || (config.type !== "local" && !config.host)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {updateConfig.isPending ? t.audit.saving : t.audit.saveChanges}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </SettingsPermissionGate>
  );
}
