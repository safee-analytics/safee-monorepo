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
import { AuditorAccessManager } from "@/components/settings/AuditorAccessManager";
import { ReencryptionProgress } from "@/components/settings/ReencryptionProgress";
import { KeyRotation } from "@/components/settings/KeyRotation";
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
  const [showAuditorManager, setShowAuditorManager] = useState(false);
  const [showReencryption, setShowReencryption] = useState(false);
  const [showKeyRotation, setShowKeyRotation] = useState(false);
  const [settings, setSettings] = useState<DocumentSettings>({
    encryptionEnabled: false,
    autoBackup: true,
    compressionEnabled: true,
    retentionPeriodDays: 365,
    allowedFileTypes: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "png"],
    maxFileSize: 50,
  });

  // TODO: Fetch encryption data from API
  // For now, using mock data when encryption is enabled
  const [encryptionData, setEncryptionData] = useState<{
    keyVersion: number;
    enabledAt: string;
    enabledBy: string;
    organizationId: string;
    encryptionKeyId: string;
    wrappedOrgKey: string;
    salt: string;
    iv: string;
  } | null>(null);

  const handleSave = async () => {
    try {
      // TODO: Implement API call to save settings
      success(t.settings.documents.saveChanges || "Document settings saved successfully");
    } catch (_err) {
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
                        onClick={() => {
                          setShowEncryptionWizard(true);
                        }}
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

                      {/* Encryption Info */}
                      {encryptionData && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Key Version</p>
                            <p className="text-sm font-semibold text-gray-900">{encryptionData.keyVersion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Enabled Date</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {new Date(encryptionData.enabledAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Enabled By</p>
                            <p className="text-sm font-semibold text-gray-900">{encryptionData.enabledBy}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            setShowAuditorManager(true);
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Manage Auditor Access
                        </button>
                        <button
                          onClick={() => {
                            setShowReencryption(true);
                          }}
                          className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          Re-encrypt Existing Files
                        </button>
                        <button
                          onClick={() => {
                            setShowKeyRotation(true);
                          }}
                          className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                        >
                          {t.settings.documents.encryption.actions.rotateKeys}
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                          {t.settings.documents.encryption.actions.viewRecoveryKey}
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
                  // Set mock encryption data after setup
                  setEncryptionData({
                    keyVersion: 1,
                    enabledAt: new Date().toISOString(),
                    enabledBy: "Current User",
                    organizationId: "mock-org-id",
                    encryptionKeyId: "mock-key-id",
                    wrappedOrgKey: "mock-wrapped-key-base64",
                    salt: "mock-salt-base64",
                    iv: "mock-iv-base64",
                  });
                }}
                onCancel={() => {
                  setShowEncryptionWizard(false);
                }}
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
                    onChange={(e) => {
                      setSettings({ ...settings, autoBackup: e.target.checked });
                    }}
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
                    onChange={(e) => {
                      setSettings({ ...settings, compressionEnabled: e.target.checked });
                    }}
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
                    onChange={(e) => {
                      setSettings({ ...settings, retentionPeriodDays: parseInt(e.target.value) });
                    }}
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
                    onChange={(e) => {
                      setSettings({ ...settings, maxFileSize: parseInt(e.target.value) });
                    }}
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
              onClick={() => {
                void handleSave();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {t.settings.documents.saveChanges}
            </button>
          </div>
        </motion.div>

        {/* Auditor Access Manager Modal */}
        {showAuditorManager && (encryptionData || settings.encryptionEnabled) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Auditor Access Management</h2>
                <button
                  onClick={() => {
                    setShowAuditorManager(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <AuditorAccessManager
                organizationId={encryptionData?.organizationId || "mock-org-id"}
                encryptionKeyId={encryptionData?.encryptionKeyId || "mock-key-id"}
                wrappedOrgKey={encryptionData?.wrappedOrgKey || "mock-wrapped-key-base64"}
                salt={encryptionData?.salt || "mock-salt-base64"}
                iv={encryptionData?.iv || "mock-iv-base64"}
              />
            </motion.div>
          </div>
        )}

        {/* Re-encryption Progress Modal */}
        {showReencryption && (encryptionData || settings.encryptionEnabled) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">File Re-encryption Dashboard</h2>
                <button
                  onClick={() => {
                    setShowReencryption(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <ReencryptionProgress
                organizationId={encryptionData?.organizationId || "mock-org-id"}
                wrappedOrgKey={encryptionData?.wrappedOrgKey || "mock-wrapped-key-base64"}
                salt={encryptionData?.salt || "mock-salt-base64"}
                iv={encryptionData?.iv || "mock-iv-base64"}
              />
            </motion.div>
          </div>
        )}

        {/* Key Rotation Modal */}
        {showKeyRotation && (encryptionData || settings.encryptionEnabled) && (
          <KeyRotation
            currentWrappedKey={encryptionData?.wrappedOrgKey || "mock-wrapped-key-base64"}
            currentSalt={encryptionData?.salt || "mock-salt-base64"}
            currentIv={encryptionData?.iv || "mock-iv-base64"}
            organizationId={encryptionData?.organizationId || "mock-org-id"}
            onComplete={() => {
              setShowKeyRotation(false);
              setShowReencryption(true);
            }}
            onCancel={() => {
              setShowKeyRotation(false);
            }}
          />
        )}
      </div>
      <SafeeToastContainer notifications={notifications} onRemove={removeToast} />
    </SettingsPermissionGate>
  );
}
