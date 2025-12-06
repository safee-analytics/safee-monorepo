"use client";

import { useState } from "react";
import { X, Shield } from "lucide-react";
import OtpInput from "react-otp-input";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useVerify2FACode } from "@/lib/api/hooks";

interface TwoFactorVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  email?: string;
}

export function TwoFactorVerification({ isOpen, onClose, onSuccess, email }: TwoFactorVerificationProps) {
  const toast = useToast();
  const [otpCode, setOtpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  const verify2FAMutation = useVerify2FACode();

  const handleVerifyCode = async () => {
    try {
      const codeToVerify = useBackupCode ? backupCode : otpCode;
      await verify2FAMutation.mutateAsync(codeToVerify);
      onSuccess();
    } catch (error) {
      console.error("2FA verification failed:", error);
      toast.error("Invalid code. Please try again.");
      if (useBackupCode) {
        setBackupCode("");
      } else {
        setOtpCode("");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {email && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Signing in as: <span className="font-medium">{email}</span>
            </p>
          </div>
        )}

        {!useBackupCode ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app to complete sign in.
            </p>

            <div className="flex justify-center">
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                numInputs={6}
                renderSeparator={<span className="mx-2">-</span>}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="!w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={otpCode.length !== 6 || verify2FAMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {verify2FAMutation.isPending ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              onClick={() => setUseBackupCode(true)}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Use a backup code instead
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Enter one of your backup recovery codes to complete sign in.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backup Code</label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter backup code"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerifyCode}
              disabled={!backupCode || verify2FAMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {verify2FAMutation.isPending ? "Verifying..." : "Verify & Sign In"}
            </button>

            <button
              onClick={() => {
                setUseBackupCode(false);
                setBackupCode("");
              }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
            >
              Use authenticator code instead
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Lost access to your authenticator app?{" "}
            <a href="/forgot-password" className="text-blue-600 hover:text-blue-700">
              Reset your password
            </a>
          </p>
        </div>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}
