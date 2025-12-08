"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Eye, EyeOff, RefreshCw, Lock, Check, X } from "lucide-react";
import {
  deriveKeyFromPassword,
  unwrapOrgKey,
  generateOrgKey,
  wrapOrgKey,
  generateRecoveryPhrase,
  validatePasswordStrength,
} from "@/lib/crypto/cryptoService";
import { useEncryptionStore } from "@/stores/useEncryptionStore";

interface KeyRotationProps {
  currentWrappedKey: string;
  currentSalt: string;
  currentIv: string;
  organizationId: string;
  onComplete: () => void;
  onCancel: () => void;
}

type RotationStep = "warning" | "verify-admin" | "mfa" | "new-password" | "confirm" | "rotating";

export function KeyRotation({
  currentWrappedKey,
  currentSalt,
  currentIv,
  organizationId: _organizationId,
  onComplete,
  onCancel,
}: KeyRotationProps) {
  const [currentStep, setCurrentStep] = useState<RotationStep>("warning");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Warning acknowledgment
  const [acknowledgedRisks, setAcknowledgedRisks] = useState({
    reencryptAll: false,
    notifyUsers: false,
    testFirst: false,
    hasBackup: false,
  });

  // Step 2: Admin verification
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Step 3: MFA code (if enabled)
  const [mfaCode, setMfaCode] = useState("");

  // Step 4: New password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, score: 0, feedback: [] as string[] });

  // Step 5: Confirmation
  const [rotationReason, setRotationReason] = useState("");
  const [newRecoveryPhrase, setNewRecoveryPhrase] = useState("");

  const { unlock } = useEncryptionStore();

  const allRisksAcknowledged =
    acknowledgedRisks.reencryptAll &&
    acknowledgedRisks.notifyUsers &&
    acknowledgedRisks.testFirst &&
    acknowledgedRisks.hasBackup;

  const handlePasswordChange = (password: string) => {
    setNewPassword(password);
    const strength = validatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleVerifyAdmin = async () => {
    try {
      setIsProcessing(true);
      setError("");

      if (!currentPassword) {
        setError("Current password is required");
        return;
      }

      // Verify admin can unlock with current password
      const masterKey = await deriveKeyFromPassword(currentPassword, currentSalt);
      await unwrapOrgKey(currentWrappedKey, currentIv, masterKey);

      // TODO: Check if user has admin role via API
      // const { data, error } = await apiClient.GET("/users/me");
      // if (error || data.role !== 'admin') throw new Error("Admin access required");

      // Check if MFA is enabled
      // TODO: Check via API if user has MFA enabled
      const mfaEnabled = false; // Mock

      if (mfaEnabled) {
        setCurrentStep("mfa");
      } else {
        setCurrentStep("new-password");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyMFA = async () => {
    try {
      setIsProcessing(true);
      setError("");

      if (!mfaCode || mfaCode.length !== 6) {
        setError("Valid 6-digit code required");
        return;
      }

      // TODO: Verify MFA code via API
      // const { error } = await apiClient.POST("/auth/verify-mfa", {
      //   body: { code: mfaCode },
      // });
      // if (error) throw new Error("Invalid MFA code");

      setCurrentStep("new-password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid MFA code");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetNewPassword = async () => {
    try {
      setIsProcessing(true);
      setError("");

      if (!passwordStrength.isValid) {
        setError("Password does not meet security requirements");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (newPassword === currentPassword) {
        setError("New password must be different from current password");
        return;
      }

      // Generate new recovery phrase
      const recoveryPhrase = generateRecoveryPhrase();
      setNewRecoveryPhrase(recoveryPhrase);

      setCurrentStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate recovery phrase");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotateKey = async () => {
    try {
      setIsProcessing(true);
      setError("");

      if (!rotationReason.trim()) {
        setError("Please provide a reason for key rotation");
        return;
      }

      setCurrentStep("rotating");

      // 1. Unwrap current org key (verify it's valid)
      const currentMasterKey = await deriveKeyFromPassword(currentPassword, currentSalt);
      await unwrapOrgKey(currentWrappedKey, currentIv, currentMasterKey);

      // 2. Generate new org key
      const newOrgKey = await generateOrgKey();

      // 3. Derive new master key from new password
      const newSalt = crypto.getRandomValues(new Uint8Array(16));
      const newSaltBase64 = btoa(String.fromCharCode(...newSalt));
      const newMasterKey = await deriveKeyFromPassword(newPassword, newSaltBase64);

      // 4. Wrap new org key with new master key
      const { wrappedKey: newWrappedKey, iv: newIv } = await wrapOrgKey(newOrgKey, newMasterKey);

      // 5. TODO: Send to backend to initiate rotation
      // This should:
      // - Store new wrapped key (mark as pending)
      // - Mark old key as deprecated
      // - Create key rotation audit log entry
      // - Queue re-encryption job
      // const { error } = await apiClient.POST("/encryption/rotate-key", {
      //   body: {
      //     newWrappedKey,
      //     newSalt: newSaltBase64,
      //     newIv,
      //     reason: rotationReason,
      //     oldKeyId: currentKeyId,
      //   },
      // });
      // if (error) throw new Error("Failed to rotate key");

      // Key rotation data prepared (will be sent to backend)
      const _rotationData = {
        newWrappedKey: newWrappedKey.substring(0, 20) + "...",
        newSalt: newSaltBase64.substring(0, 10) + "...",
        newIv: newIv.substring(0, 10) + "...",
        reason: rotationReason,
      };

      // 6. Store new keys in memory
      unlock(newOrgKey, newMasterKey);

      // Clear sensitive data
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMfaCode("");

      // Show success and trigger re-encryption dashboard
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate encryption key");
      setCurrentStep("confirm");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Rotate Encryption Key</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Change organization-wide encryption password
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-between">
          {["warning", "verify-admin", "mfa", "new-password", "confirm", "rotating"].map((step, idx) => {
            const stepIndex = ["warning", "verify-admin", "mfa", "new-password", "confirm", "rotating"].indexOf(
              currentStep,
            );
            const isActive = idx === stepIndex;
            const isCompleted = idx < stepIndex;

            return (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-green-600 bg-green-600 text-white"
                      : isActive
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-700"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>
                {idx < 5 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isCompleted ? "bg-green-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Warning & Acknowledgment */}
        {currentStep === "warning" && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="mb-3 flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300">
                    Critical Operation - Read Carefully
                  </p>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-400">
                    Key rotation will re-encrypt ALL organization files. This is expensive and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Please acknowledge the following before proceeding:
              </p>

              {[
                {
                  key: "reencryptAll" as const,
                  label: "I understand all files will be re-encrypted (may take hours)",
                },
                {
                  key: "notifyUsers" as const,
                  label: "I will notify all users about the new password",
                },
                {
                  key: "testFirst" as const,
                  label: "I have tested this process in a non-production environment",
                },
                {
                  key: "hasBackup" as const,
                  label: "I have verified recent backups exist",
                },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgedRisks[key]}
                    onChange={(e) => setAcknowledgedRisks({ ...acknowledgedRisks, [key]: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep("verify-admin")}
                disabled={!allRisksAcknowledged}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                I Understand, Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Verify Admin */}
        {currentStep === "verify-admin" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your current encryption password to verify admin access:
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyAdmin()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter current password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("warning")}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleVerifyAdmin}
                disabled={isProcessing || !currentPassword}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: MFA (if enabled) */}
        {currentStep === "mfa" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter your 6-digit authentication code:
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">MFA Code</label>
              <input
                type="text"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").substring(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyMFA()}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl font-mono tracking-widest focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("verify-admin")}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleVerifyMFA}
                disabled={isProcessing || mfaCode.length !== 6}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: New Password */}
        {currentStep === "new-password" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create a new strong password for organization encryption:
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password (16+ characters)"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.score >= 4
                            ? "bg-green-600"
                            : passwordStrength.score >= 3
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {passwordStrength.score >= 4
                        ? "Strong"
                        : passwordStrength.score >= 3
                          ? "Medium"
                          : "Weak"}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                          <X className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetNewPassword()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("verify-admin")}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleSetNewPassword}
                disabled={isProcessing || !passwordStrength.isValid || !confirmPassword}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Continue"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm & Reason */}
        {currentStep === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/20 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-300">New Recovery Phrase</p>
              <p className="mt-2 rounded bg-white p-3 font-mono text-sm text-gray-900 dark:bg-gray-800 dark:text-white">
                {newRecoveryPhrase}
              </p>
              <p className="mt-2 text-xs text-yellow-800 dark:text-yellow-400">
                Save this phrase securely. You&apos;ll need it if you forget the new password.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Reason for Key Rotation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rotationReason}
                onChange={(e) => setRotationReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Suspected key compromise, regular security maintenance, employee departure..."
                rows={3}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will be logged for audit purposes
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">What happens next:</p>
              <ul className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-400">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>New encryption key will be activated immediately</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Background re-encryption will begin for all existing files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>All users will need the new password on next login</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>Old key remains available for file access until re-encryption completes</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep("new-password")}
                disabled={isProcessing}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleRotateKey}
                disabled={isProcessing || !rotationReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? "Rotating Key..." : "Rotate Encryption Key"}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Rotating */}
        {currentStep === "rotating" && (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <RefreshCw className="h-16 w-16 animate-spin text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Rotating Encryption Key...</p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Please wait while we generate and activate the new encryption key.
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400">
                <Lock className="h-4 w-4" />
                <span>Do not close this window</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
