"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Save,
  HardDrive,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import { useToast, useConfirm, SafeeToastContainer } from "@/components/feedback";
import {
  useGetDatabaseStats,
  useGetBackupSettings,
  useUpdateBackupSettings,
  useGetBackupHistory,
  useCreateBackup,
  useRestoreBackup,
  useDownloadBackup,
  useOptimizeDatabase,
  useRunMaintenance,
  type Backup,
  type BackupSettings,
} from "@/lib/api/hooks/database";

export default function DatabaseSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const { confirm, ConfirmModalComponent } = useConfirm();

  // Fetch data
  const { data: dbStats, isLoading: statsLoading } = useGetDatabaseStats();
  const { data: backupSettings, isLoading: settingsLoading } = useGetBackupSettings();
  const { data: backups = [], isLoading: backupsLoading } = useGetBackupHistory();

  // Mutations
  const updateSettings = useUpdateBackupSettings();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const downloadBackup = useDownloadBackup();
  const optimizeDb = useOptimizeDatabase();
  const runMaintenance = useRunMaintenance();

  // Local state for form
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: "30",
    backupLocation: "cloud",
    compressionEnabled: true,
    encryptionEnabled: true,
  });

  // Database mode: managed (by us) or custom (user provides their own)
  const [dbMode, setDbMode] = useState<"managed" | "custom">("managed");
  const [customDbConfig, setCustomDbConfig] = useState({
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ssl: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (backupSettings) {
      setSettings(backupSettings);
    }
  }, [backupSettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      toast.success(t.settings.database.alerts.settingsSaved);
    } catch (_error) {
      toast.error(t.settings.database.alerts.settingsFailed);
    }
  };

  const handleBackup = async () => {
    try {
      await createBackup.mutateAsync();
      toast.success(t.settings.database.alerts.backupSuccess);
    } catch (_error) {
      toast.error(t.settings.database.alerts.backupFailed);
    }
  };

  const handleRestore = async (backupId: string) => {
    const confirmed = await confirm({
      title: t.settings.database.history.restore,
      message: t.settings.database.alerts.restoreConfirm,
      type: "warning",
      confirmText: t.settings.database.history.restore,
    });

    if (!confirmed) return;

    try {
      await restoreBackup.mutateAsync(backupId);
      toast.success(t.settings.database.alerts.restoreSuccess);
    } catch (_error) {
      toast.error(t.settings.database.alerts.restoreFailed);
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      await downloadBackup.mutateAsync(backupId);
    } catch (_error) {
      toast.error(t.settings.database.alerts.downloadFailed);
    }
  };

  const handleOptimize = async () => {
    try {
      await optimizeDb.mutateAsync();
      toast.success(t.settings.database.alerts.optimizeSuccess);
    } catch (_error) {
      toast.error(t.settings.database.alerts.optimizeFailed);
    }
  };

  const handleMaintenance = async () => {
    try {
      await runMaintenance.mutateAsync();
      toast.success(t.settings.database.alerts.maintenanceSuccess);
    } catch (_error) {
      toast.error(t.settings.database.alerts.maintenanceFailed);
    }
  };

  const getStatusIcon = (status: Backup["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "in-progress":
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  return (
    <SettingsPermissionGate>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.database.title}</h1>
            <p className="text-gray-600">{t.settings.database.subtitle}</p>
          </div>

          {/* Database Mode Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t.settings.database.configuration.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setDbMode("managed")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  dbMode === "managed"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Database
                    className={`w-5 h-5 ${dbMode === "managed" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <h3 className={`font-semibold ${dbMode === "managed" ? "text-blue-900" : "text-gray-900"}`}>
                    {t.settings.database.configuration.managed.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {t.settings.database.configuration.managed.description}
                </p>
              </button>

              <button
                onClick={() => setDbMode("custom")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  dbMode === "custom" ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive
                    className={`w-5 h-5 ${dbMode === "custom" ? "text-blue-600" : "text-gray-500"}`}
                  />
                  <h3 className={`font-semibold ${dbMode === "custom" ? "text-blue-900" : "text-gray-900"}`}>
                    {t.settings.database.configuration.custom.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">
                  {t.settings.database.configuration.custom.description}
                </p>
              </button>
            </div>

            {/* Custom Database Configuration */}
            {dbMode === "custom" && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.database.configuration.custom.host}
                    </label>
                    <input
                      type="text"
                      value={customDbConfig.host}
                      onChange={(e) => setCustomDbConfig({ ...customDbConfig, host: e.target.value })}
                      placeholder={t.settings.database.configuration.custom.hostPlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.database.configuration.custom.port}
                    </label>
                    <input
                      type="text"
                      value={customDbConfig.port}
                      onChange={(e) => setCustomDbConfig({ ...customDbConfig, port: e.target.value })}
                      placeholder={t.settings.database.configuration.custom.portPlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.settings.database.configuration.custom.databaseName}
                  </label>
                  <input
                    type="text"
                    value={customDbConfig.database}
                    onChange={(e) => setCustomDbConfig({ ...customDbConfig, database: e.target.value })}
                    placeholder={t.settings.database.configuration.custom.databasePlaceholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.database.configuration.custom.username}
                    </label>
                    <input
                      type="text"
                      value={customDbConfig.username}
                      onChange={(e) => setCustomDbConfig({ ...customDbConfig, username: e.target.value })}
                      placeholder={t.settings.database.configuration.custom.usernamePlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.database.configuration.custom.password}
                    </label>
                    <input
                      type="password"
                      value={customDbConfig.password}
                      onChange={(e) => setCustomDbConfig({ ...customDbConfig, password: e.target.value })}
                      placeholder={t.settings.database.configuration.custom.passwordPlaceholder}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ssl"
                    checked={customDbConfig.ssl}
                    onChange={(e) => setCustomDbConfig({ ...customDbConfig, ssl: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="ssl" className="text-sm font-medium text-gray-700">
                    {t.settings.database.configuration.custom.useSSL}
                  </label>
                </div>

                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                  {t.settings.database.configuration.custom.testConnection}
                </button>
              </div>
            )}
          </div>

          {/* Only show these sections for managed database */}
          {dbMode === "managed" && (
            <>
              {/* Database Health */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.settings.database.health.title}
                </h2>
                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : !dbStats ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">{t.settings.database.health.unavailable}</p>
                    <p className="text-sm text-gray-400">{t.settings.database.health.notConfigured}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <HardDrive className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {t.settings.database.health.stats.totalSize}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{dbStats.totalSize}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {t.settings.database.health.stats.tables}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{dbStats.tableCount}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {t.settings.database.health.stats.totalRows}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{dbStats.rowCount}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {t.settings.database.health.stats.status}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-600 capitalize">{dbStats.health}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={handleOptimize}
                        disabled={optimizeDb.isPending}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {optimizeDb.isPending
                          ? t.settings.database.health.actions.optimizing
                          : t.settings.database.health.actions.optimize}
                      </button>
                      <button
                        onClick={handleMaintenance}
                        disabled={runMaintenance.isPending}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {runMaintenance.isPending
                          ? t.settings.database.health.actions.running
                          : t.settings.database.health.actions.maintenance}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Backup Settings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.settings.database.backup.title}
                </h2>
                {settingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t.settings.database.backup.automatic.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t.settings.database.backup.automatic.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.autoBackup && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.settings.database.backup.frequency.label}
                          </label>
                          <select
                            value={settings.backupFrequency}
                            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="hourly">{t.settings.database.backup.frequency.hourly}</option>
                            <option value="daily">{t.settings.database.backup.frequency.daily}</option>
                            <option value="weekly">{t.settings.database.backup.frequency.weekly}</option>
                            <option value="monthly">{t.settings.database.backup.frequency.monthly}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.settings.database.backup.retention.label}
                          </label>
                          <select
                            value={settings.backupRetention}
                            onChange={(e) => setSettings({ ...settings, backupRetention: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="7">{t.settings.database.backup.retention.sevenDays}</option>
                            <option value="14">{t.settings.database.backup.retention.fourteenDays}</option>
                            <option value="30">{t.settings.database.backup.retention.thirtyDays}</option>
                            <option value="90">{t.settings.database.backup.retention.ninetyDays}</option>
                            <option value="365">{t.settings.database.backup.retention.oneYear}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t.settings.database.backup.location.label}
                          </label>
                          <select
                            value={settings.backupLocation}
                            onChange={(e) => setSettings({ ...settings, backupLocation: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="cloud">{t.settings.database.backup.location.cloud}</option>
                            <option value="local">{t.settings.database.backup.location.local}</option>
                            <option value="both">{t.settings.database.backup.location.both}</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t.settings.database.backup.compression.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t.settings.database.backup.compression.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.compressionEnabled}
                          onChange={(e) => setSettings({ ...settings, compressionEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                      <div>
                        <p className="font-medium text-gray-900">
                          {t.settings.database.backup.encryption.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t.settings.database.backup.encryption.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.encryptionEnabled}
                          onChange={(e) => setSettings({ ...settings, encryptionEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={updateSettings.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {updateSettings.isPending
                          ? t.settings.database.backup.saving
                          : t.settings.database.backup.saveButton}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Backup */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.settings.database.manual.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{t.settings.database.manual.description}</p>
                <button
                  onClick={handleBackup}
                  disabled={createBackup.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {createBackup.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      {t.settings.database.manual.creating}
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {t.settings.database.manual.createButton}
                    </>
                  )}
                </button>
              </div>

              {/* Backup History */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t.settings.database.history.title}</h2>
                  {backups.length > 0 && backups[0] && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {t.settings.database.history.lastBackup} {backups[0].date}
                      </span>
                    </div>
                  )}
                </div>

                {backupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : backups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t.settings.database.history.noBackups}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(backup.status)}
                          <div>
                            <p className="font-medium text-gray-900">{backup.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span>{backup.size}</span>
                              <span>{backup.date}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  backup.type === "automatic"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {backup.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(backup.id)}
                            disabled={restoreBackup.isPending || backup.status !== "completed"}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            {t.settings.database.history.restore}
                          </button>
                          <button
                            onClick={() => handleDownload(backup.id)}
                            disabled={downloadBackup.isPending || backup.status !== "completed"}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                          >
                            <Download className="w-4 h-4" />
                            {t.settings.database.history.download}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">{t.settings.database.warning.title}</p>
                  <p className="text-sm text-yellow-700 mt-1">{t.settings.database.warning.message}</p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      <ConfirmModalComponent />
    </SettingsPermissionGate>
  );
}
