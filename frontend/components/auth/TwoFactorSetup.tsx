"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Shield, Key, Download } from "lucide-react";
import QRCode from "qrcode";
import OtpInput from "react-otp-input";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useEnable2FA, useVerify2FACode, useGenerate2FABackupCodes } from "@/lib/api/hooks";

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetup({ isOpen, onClose, onSuccess }: TwoFactorSetupProps) {
  const toast = useToast();
  const [step, setStep] = useState<"password" | "qr" | "verify" | "backup">("password");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const enable2FAMutation = useEnable2FA();
  const verify2FAMutation = useVerify2FACode();
  const generateBackupCodesMutation = useGenerate2FABackupCodes();

  const handleClose = () => {
    onClose();
    setStep("password");
    setPassword("");
    setOtpCode("");
    setQrCodeDataUrl("");
    setSecret("");
    setBackupCodes([]);
    setCopied(false);
  };
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("password");
      setPassword("");
      setOtpCode("");
      setQrCodeDataUrl("");
      setSecret("");
      setBackupCodes([]);
      setCopied(false);
    }
  }, [isOpen]);

  const handleEnableTwoFactor = async () => {
    try {
      const result = await enable2FAMutation.mutateAsync(password);

      // Generate QR code from the OTP auth URL
      const qrUrl = await QRCode.toDataURL(result.totpURI);
      setQrCodeDataUrl(qrUrl);

      // Extract secret from the TOTP URI (format: otpauth://totp/...?secret=SECRET&...)
      const secretMatch = /secret=([^&]+)/.exec(result.totpURI);
      if (secretMatch) {
        setSecret(secretMatch[1]);
      }

      setStep("qr");
    } catch (err) {
      console.error("Failed to enable 2FA:", err);
      toast.error("Failed to enable 2FA. Please check your password.");
    }
  };

  const handleVerifyCode = async () => {
    try {
      await verify2FAMutation.mutateAsync(otpCode);

      // Generate backup codes
      const codes = await generateBackupCodesMutation.mutateAsync(password);
      setBackupCodes(codes.backupCodes || []);
      setStep("backup");
    } catch (err) {
      console.error("Invalid 2FA code:", err);
      toast.error("Invalid code. Please try again.");
      setOtpCode("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    onSuccess();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Enable Two-Factor Authentication</h2>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Password Confirmation */}
        {step === "password" && (
          <div className="space-y-4">
            <p className="text-gray-600">Enter your password to continue with 2FA setup.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                autoFocus
              />
            </div>
            <button
              onClick={handleEnableTwoFactor}
              disabled={!password || enable2FAMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {enable2FAMutation.isPending ? "Processing..." : "Continue"}
            </button>
          </div>
        )}

        {/* Step 2: QR Code Display */}
        {step === "qr" && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            {/* QR Code */}
            <div className="flex justify-center py-4">
              {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="2FA QR Code" className="w-48 h-48" />}
            </div>

            {/* Manual Entry */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Or enter manually:
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">{secret}</code>
                <button
                  onClick={() => { copyToClipboard(secret); }}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => { setStep("verify"); }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              I&apos;ve Scanned the Code
            </button>
          </div>
        )}

        {/* Step 3: Verify Code */}
        {step === "verify" && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app to verify setup.
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
              {verify2FAMutation.isPending ? "Verifying..." : "Verify & Enable"}
            </button>

            <button
              onClick={() => { setStep("qr"); }}
              className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Back to QR Code
            </button>
          </div>
        )}

        {/* Step 4: Backup Codes */}
        {step === "backup" && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-medium mb-2">Save Your Backup Codes</p>
              <p className="text-yellow-700 text-sm">
                Store these codes in a safe place. You can use them to access your account if you lose your
                device.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono bg-white px-2 py-1 rounded">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { copyToClipboard(backupCodes.join("\n")); }}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={downloadBackupCodes}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Done - I&apos;ve Saved My Codes
            </button>
          </div>
        )}
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}
