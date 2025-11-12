"use client";

import { useState } from "react";
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

interface Backup {
  id: string;
  name: string;
  size: string;
  date: string;
  status: "completed" | "failed" | "in-progress";
  type: "automatic" | "manual";
}

export default function DatabaseSettings() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [settings, setSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: "30",
    backupLocation: "cloud",
    compressionEnabled: true,
    encryptionEnabled: true,
  });

  const [backups] = useState<Backup[]>([
    {
      id: "1",
      name: "Automatic Backup - 2024-01-20",
      size: "2.4 GB",
      date: "2024-01-20 03:00:00",
      status: "completed",
      type: "automatic",
    },
    {
      id: "2",
      name: "Manual Backup - Pre-Migration",
      size: "2.3 GB",
      date: "2024-01-19 14:30:00",
      status: "completed",
      type: "manual",
    },
    {
      id: "3",
      name: "Automatic Backup - 2024-01-19",
      size: "2.3 GB",
      date: "2024-01-19 03:00:00",
      status: "completed",
      type: "automatic",
    },
    {
      id: "4",
      name: "Automatic Backup - 2024-01-18",
      size: "2.2 GB",
      date: "2024-01-18 03:00:00",
      status: "completed",
      type: "automatic",
    },
  ]);

  const [dbStats] = useState({
    totalSize: "2.4 GB",
    tableCount: 156,
    rowCount: "1,234,567",
    lastOptimized: "2 days ago",
    health: "good",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Database settings updated successfully");
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsBackingUp(false);
    alert("Backup completed successfully");
  };

  const handleRestore = async (backupId: string) => {
    if (
      confirm(
        "Are you sure you want to restore this backup? This will replace your current database with the backup data.",
      )
    ) {
      setIsRestoring(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setIsRestoring(false);
      alert("Database restored successfully");
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Settings</h1>
            <p className="text-gray-600">Manage backups, maintenance, and database configuration</p>
          </div>

          {/* Database Health */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Health</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Size</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{dbStats.totalSize}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Tables</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{dbStats.tableCount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Total Rows</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{dbStats.rowCount}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Status</span>
                </div>
                <p className="text-2xl font-bold text-green-600 capitalize">{dbStats.health}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                Optimize Database
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                Run Maintenance
              </button>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Automatic Backups</p>
                  <p className="text-sm text-gray-500">Schedule regular database backups</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                    <select
                      value={settings.backupFrequency}
                      onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily at 3:00 AM</option>
                      <option value="weekly">Weekly (Sundays at 3:00 AM)</option>
                      <option value="monthly">Monthly (1st of month at 3:00 AM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backup Retention (days)
                    </label>
                    <select
                      value={settings.backupRetention}
                      onChange={(e) => setSettings({ ...settings, backupRetention: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="365">1 year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
                    <select
                      value={settings.backupLocation}
                      onChange={(e) => setSettings({ ...settings, backupLocation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cloud">Cloud Storage (Recommended)</option>
                      <option value="local">Local Storage</option>
                      <option value="both">Both Cloud and Local</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Compression</p>
                  <p className="text-sm text-gray-500">Reduce backup file size</p>
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
                  <p className="font-medium text-gray-900">Encryption</p>
                  <p className="text-sm text-gray-500">Encrypt backup files for security</p>
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
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>

          {/* Manual Backup */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Manual Backup</h2>
            <p className="text-sm text-gray-600 mb-4">
              Create an immediate backup of your database. This backup will be stored alongside your automatic
              backups.
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isBackingUp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Create Backup Now
                </>
              )}
            </button>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Last backup: 3:00 AM today</span>
              </div>
            </div>

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
                      disabled={isRestoring || backup.status !== "completed"}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      disabled={backup.status !== "completed"}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Important</p>
              <p className="text-sm text-yellow-700 mt-1">
                Always verify your backups after creation. Test restoring to a separate environment
                periodically to ensure data integrity.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </SettingsPermissionGate>
  );
}
