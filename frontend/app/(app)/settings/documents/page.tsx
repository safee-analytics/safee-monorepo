"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Lock,
  CheckCircle,
  Settings as SettingsIcon,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import { EncryptionSetupWizard } from "@/components/settings/EncryptionSetupWizard";
import { useToast, SafeeToastContainer } from "@/components/feedback/SafeeToast";

interface DocumentSettings {
  encryptionEnabled: boolean;
  autoBackup: boolean;
  compressionEnabled: boolean;
  retentionPeriodDays: number;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export default function DocumentSettingsPage() {
  const { t } = useTranslation();
  const { notifications, success, error, removeToast } = useToast();
  const [showEncryptionWizard, setShowEncryptionWizard] = useState(false);
  const [settings, setSettings] = useState<DocumentSettings>({
    encryptionEnabled: false,
    autoBackup: true,
    compressionEnabled: true,
    retentionPeriodDays: 365,
    allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png"],
    maxFileSize: 50,
  });

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      success(t.settings.documents.saveChanges || "Document settings saved successfully");
    } catch (_error) {
      error(t.common.error || "Failed to save document settings");
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.documents.title}</h1>
            <p className="text-gray-600">{t.settings.documents.subtitle}</p>
          </div>

          {/* Encryption Settings */}
          {!showEncryptionWizard ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-start gap-3 mb-6">
                <Shield className="w-6 h-6 text-red-600" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {t.settings.documents.encryption.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">{t.settings.documents.encryption.subtitle}</p>

                  {!settings.encryptionEnabled ? (
                    <div className="space-y-4">
                      {/* Warning Box */}
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-800">
                            <p className="font-semibold mb-2">
                              {t.settings.documents.encryption.warning.title}
                            </p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>{t.settings.documents.encryption.warning.losePassword}</li>
                              <li>{t.settings.documents.encryption.warning.noServerSearch}</li>
                              <li>{t.settings.documents.encryption.warning.noServerProcessing}</li>
                              <li>{t.settings.documents.encryption.warning.passwordEveryLogin}</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowEncryptionWizard(true)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Lock className="w-5 h-5" />
                        {t.settings.documents.encryption.setupButton}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          {t.settings.documents.encryption.enabled}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          {t.settings.documents.encryption.actions.viewRecoveryKey}
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          {t.settings.documents.encryption.actions.rotateKeys}
                        </button>
                        <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50">
                          {t.settings.documents.encryption.actions.disableEncryption}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <EncryptionSetupWizard
                onComplete={() => {
                  setShowEncryptionWizard(false);
                  setSettings({ ...settings, encryptionEnabled: true });
                }}
                onCancel={() => setShowEncryptionWizard(false)}
              />
            </div>
          )}

          {/* Document Management Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <SettingsIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t.settings.documents.management.title}
                </h2>
                <p className="text-sm text-gray-600">{t.settings.documents.management.subtitle}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Auto Backup */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{t.settings.documents.management.autoBackup}</p>
                  <p className="text-sm text-gray-500">{t.settings.documents.management.autoBackupDesc}</p>
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

              {/* Compression */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{t.settings.documents.management.compression}</p>
                  <p className="text-sm text-gray-500">{t.settings.documents.management.compressionDesc}</p>
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

              {/* Retention Period */}
              <div className="py-3 border-b border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.documents.management.retention}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={settings.retentionPeriodDays}
                    onChange={(e) =>
                      setSettings({ ...settings, retentionPeriodDays: parseInt(e.target.value) })
                    }
                    min="30"
                    max="3650"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-600">{t.settings.documents.management.days}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{t.settings.documents.management.retentionDesc}</p>
              </div>

              {/* Max File Size */}
              <div className="py-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.documents.management.maxFileSize}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                    min="1"
                    max="500"
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-gray-600">{t.settings.documents.management.mb}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {t.settings.documents.management.maxFileSizeDesc}
                </p>
              </div>
            </div>
          </div>

          {/* File Type Restrictions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {t.settings.documents.fileTypes.title}
                </h2>
                <p className="text-sm text-gray-600">{t.settings.documents.fileTypes.subtitle}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "png", "gif", "zip", "txt"].map(
                (type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowedFileTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({
                            ...settings,
                            allowedFileTypes: [...settings.allowedFileTypes, type],
                          });
                        } else {
                          setSettings({
                            ...settings,
                            allowedFileTypes: settings.allowedFileTypes.filter((t) => t !== type),
                          });
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-mono text-gray-700">.{type}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {t.settings.documents.saveChanges}
            </button>
          </div>
        </motion.div>
      </div>
      <SafeeToastContainer notifications={notifications} onRemove={removeToast} />
    </SettingsPermissionGate>
  );
}
