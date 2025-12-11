"use client";

import { useState, useEffect, startTransition } from "react";
import { motion } from "framer-motion";
import { Lock, Shield, Smartphone, Key, Eye, EyeOff, AlertTriangle, Save, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { SettingsPermissionGate } from "@/components/settings/SettingsPermissionGate";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { logError } from "@/lib/utils/logger";
import {
  useGetSecuritySettings,
  useUpdateSecuritySettings,
  useGetActiveSessions,
  useRevokeSession,
  useChangePassword,
  type SecuritySettings as SecuritySettingsType,
} from "@/lib/api/hooks/security";

export default function SecuritySettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Fetch data
  const { data: securitySettings, isLoading: _settingsLoading } = useGetSecuritySettings();
  const { data: sessions = [], isLoading: sessionsLoading } = useGetActiveSessions();

  // Mutations
  const updateSettings = useUpdateSecuritySettings();
  const revokeSession = useRevokeSession();
  const changePassword = useChangePassword();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [security, setSecurity] = useState<SecuritySettingsType>({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    requirePasswordChange: false,
    allowMultipleSessions: true,
    ipWhitelisting: false,
    loginNotifications: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (securitySettings) {
      startTransition(() => {
        setSecurity(securitySettings);
      });
    }
  }, [securitySettings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(security);
      toast.success("Security settings updated successfully");
    } catch (_err) {
      toast.error("Failed to update security settings");
      logError("Security settings update failed", _err, { security });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword.mutateAsync(passwordData);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (_err) {
      toast.error("Failed to change password");
      logError("Password change failed", _err);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
    } catch (_err) {
      toast.error("Failed to revoke session");
      logError("Revoke session failed", _err, { sessionId });
    }
  };

  return (
    <SettingsPermissionGate>
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.settings.security.title}</h1>
            <p className="text-gray-600">{t.settings.security.subtitle}</p>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              {t.settings.security.changePassword.title}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.security.changePassword.currentPassword}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                    }}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCurrentPassword(!showCurrentPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.security.changePassword.newPassword}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                    }}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPassword(!showNewPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {t.settings.security.changePassword.requirements}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.security.changePassword.confirmPassword}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                    }}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  void handlePasswordChange();
                }}
                disabled={changePassword.isPending}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {changePassword.isPending
                  ? t.settings.security.changePassword.changing
                  : t.settings.security.changePassword.changeButton}
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-gray-500 mt-1" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {t.settings.security.twoFactor.title}
                  </h2>
                  <p className="text-sm text-gray-500">{t.settings.security.twoFactor.subtitle}</p>
                </div>
              </div>
              {!security.twoFactorEnabled ? (
                <button
                  onClick={() => {
                    setShow2FASetup(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  {t.settings.security.twoFactor.enable}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSecurity({ ...security, twoFactorEnabled: false });
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  {t.settings.security.twoFactor.disable}
                </button>
              )}
            </div>
            {security.twoFactorEnabled && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2">{t.settings.security.twoFactor.enabled}</p>
                <button className="text-sm text-green-700 hover:text-green-800 font-medium">
                  {t.settings.security.twoFactor.recoveryCodes}
                </button>
              </div>
            )}
          </div>

          {/* Security Preferences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t.settings.security.preferences.title}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.security.preferences.sessionTimeout}
                </label>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => {
                    setSecurity({ ...security, sessionTimeout: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="15">{t.settings.security.preferences.sessionTimeoutOptions["15"]}</option>
                  <option value="30">{t.settings.security.preferences.sessionTimeoutOptions["30"]}</option>
                  <option value="60">{t.settings.security.preferences.sessionTimeoutOptions["60"]}</option>
                  <option value="120">{t.settings.security.preferences.sessionTimeoutOptions["120"]}</option>
                  <option value="never">{t.settings.security.preferences.sessionTimeoutOptions.never}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.security.preferences.passwordExpiry}
                </label>
                <select
                  value={security.passwordExpiry}
                  onChange={(e) => {
                    setSecurity({ ...security, passwordExpiry: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="30">{t.settings.security.preferences.passwordExpiryOptions["30"]}</option>
                  <option value="60">{t.settings.security.preferences.passwordExpiryOptions["60"]}</option>
                  <option value="90">{t.settings.security.preferences.passwordExpiryOptions["90"]}</option>
                  <option value="180">{t.settings.security.preferences.passwordExpiryOptions["180"]}</option>
                  <option value="never">{t.settings.security.preferences.passwordExpiryOptions.never}</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">
                    {t.settings.security.preferences.requirePasswordChange}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.settings.security.preferences.requirePasswordChangeDesc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.requirePasswordChange}
                    onChange={(e) => {
                      setSecurity({ ...security, requirePasswordChange: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">
                    {t.settings.security.preferences.allowMultipleSessions}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.settings.security.preferences.allowMultipleSessionsDesc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.allowMultipleSessions}
                    onChange={(e) => {
                      setSecurity({ ...security, allowMultipleSessions: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">
                    {t.settings.security.preferences.loginNotifications}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.settings.security.preferences.loginNotificationsDesc}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginNotifications}
                    onChange={(e) => {
                      setSecurity({ ...security, loginNotifications: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.settings.security.sessions.title}</h2>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gray-500 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {session.device}
                            {session.current && (
                              <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                {t.settings.security.sessions.current}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{session.location}</p>
                          <p className="text-xs text-gray-400">
                            {t.settings.security.sessions.lastActive}: {session.lastActive}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <button
                          onClick={() => {
                            void handleRevokeSession(session.id);
                          }}
                          disabled={revokeSession.isPending}
                          className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {revokeSession.isPending
                            ? t.settings.security.sessions.revoking
                            : t.settings.security.sessions.revoke}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button className="mt-4 text-sm text-red-600 hover:text-red-700 font-medium">
                  {t.settings.security.sessions.revokeAll}
                </button>
              </>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 mb-1">
                  {t.settings.security.dangerZone.title}
                </h2>
                <p className="text-sm text-red-700">{t.settings.security.dangerZone.subtitle}</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
                {t.settings.security.dangerZone.deleteAccount}
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                void handleSave();
              }}
              disabled={updateSettings.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateSettings.isPending ? t.settings.security.saving : t.settings.security.saveChanges}
            </button>
          </div>
        </motion.div>

        {/* Two-Factor Setup Modal */}
        <TwoFactorSetup
          isOpen={show2FASetup}
          onClose={() => {
            setShow2FASetup(false);
          }}
          onSuccess={() => {
            setSecurity({ ...security, twoFactorEnabled: true });
            void handleSave();
          }}
        />

        <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
      </div>
    </SettingsPermissionGate>
  );
}
