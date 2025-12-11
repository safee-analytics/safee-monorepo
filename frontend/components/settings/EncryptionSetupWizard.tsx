"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  X,
  Search,
  FileText,
} from "lucide-react";
import {
  deriveKeyFromPassword,
  generateOrgKey,
  wrapOrgKey,
  generateRecoveryPhrase,
  validatePasswordStrength,
  generateSalt,
} from "@/lib/crypto/cryptoService";
import { useEncryptionStore } from "@/stores/useEncryptionStore";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { useToast } from "@/components/feedback/SafeeToast";

interface EncryptionSetupWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
}

type Step = "terms" | "auth" | "password" | "recovery" | "confirm" | "complete";

export function EncryptionSetupWizard({ onComplete, onCancel }: EncryptionSetupWizardProps) {
  const { t } = useTranslation();
  const { error: toastError } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("terms");

  // Terms step
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [downsideAccepted, setDownsideAccepted] = useState(false);

  // Auth step
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  // Password step
  const [encryptionPassword, setEncryptionPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Recovery step
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Processing
  const [isEnabling, setIsEnabling] = useState(false);
  const { unlock } = useEncryptionStore();

  // Password strength validation
  const passwordStrength = encryptionPassword ? validatePasswordStrength(encryptionPassword) : null;
  const passwordsMatch = encryptionPassword === confirmPassword && encryptionPassword.length > 0;

  // Confirmation text validation
  const REQUIRED_CONFIRMATION = t.settings.documents.encryption.wizard.auth.confirmationText;
  const confirmationMatches = confirmationText === REQUIRED_CONFIRMATION;

  const handleGeneratePhrase = () => {
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
  };

  const handleCopyPhrase = async () => {
    await navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  const handleDownloadPhrase = () => {
    const blob = new Blob(
      [
        `Safee Analytics Recovery Phrase\n\n${recoveryPhrase}\n\nKeep this safe - it's the only way to recover access if you forget your password.`,
      ],
      {
        type: "text/plain",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "safee-recovery-phrase.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEnableEncryption = async () => {
    try {
      setIsEnabling(true);

      // Generate salt
      const salt = generateSalt();

      // Derive master key from password
      const masterKey = await deriveKeyFromPassword(encryptionPassword, salt);

      // Generate organization encryption key
      const orgKey = await generateOrgKey();

      // Wrap org key with master key
      const { wrappedKey: _wrappedKey, iv: _iv } = await wrapOrgKey(orgKey, masterKey);

      // TODO: Send to backend
      // await api.post('/api/v1/encryption/setup', {
      //   wrappedOrgKey: _wrappedKey,
      //   salt,
      //   iv: _iv,
      //   keyVersion: 1,
      //   algorithm: 'AES-256-GCM',
      //   derivationParams: {
      //     iterations: 600000,
      //     hash: 'SHA-256',
      //     keyLength: 256,
      //   },
      // });

      // Store keys in memory
      unlock(orgKey, masterKey);

      // Move to completion step
      setCurrentStep("complete");
    } catch (err) {
      console.error("Failed to enable encryption:", err);
      toastError("Failed to enable encryption. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const handleComplete = () => {
    // TODO: Trigger background re-encryption if needed
    onComplete();
  };

  const stepLabels: Record<Step, string> = {
    terms: t.settings.documents.encryption.wizard.termsStep,
    auth: t.settings.documents.encryption.wizard.authStep,
    password: t.settings.documents.encryption.wizard.passwordStep,
    recovery: t.settings.documents.encryption.wizard.recoveryStep,
    confirm: t.settings.documents.encryption.wizard.confirmStep,
    complete: t.settings.documents.encryption.wizard.completeStep,
  };

  const steps: Step[] = ["terms", "auth", "password", "recovery", "confirm", "complete"];
  const currentStepIndex = steps.indexOf(currentStep);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-gray-200 rounded-lg p-8"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t.settings.documents.encryption.wizard.title}
            </h2>
            <p className="text-sm text-gray-500">
              {stepLabels[currentStep]} - Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8 flex gap-2">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`h-2 flex-1 rounded-full transition-all ${
              index <= currentStepIndex ? "bg-red-600" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Terms & Conditions */}
        {currentStep === "terms" && (
          <motion.div
            key="terms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      {t.settings.documents.encryption.wizard.terms.critical}
                    </h3>
                    <p className="text-red-800">
                      {t.settings.documents.encryption.wizard.terms.permanentDecision}
                    </p>
                  </div>
                </div>
              </div>

              {/* Downsides */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t.settings.documents.encryption.wizard.terms.limitations}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Search className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {t.settings.documents.encryption.wizard.terms.noServerSearch}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.settings.documents.encryption.wizard.terms.noServerSearchDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {t.settings.documents.encryption.wizard.terms.noServerProcessing}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.settings.documents.encryption.wizard.terms.noServerProcessingDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {t.settings.documents.encryption.wizard.terms.passwordRequired}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.settings.documents.encryption.wizard.terms.passwordRequiredDesc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {t.settings.documents.encryption.wizard.terms.performanceImpact}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t.settings.documents.encryption.wizard.terms.performanceImpactDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Acceptance */}
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => { setTermsAccepted(e.target.checked); }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t.settings.documents.encryption.wizard.terms.acceptLoseData}
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downsideAccepted}
                    onChange={(e) => { setDownsideAccepted(e.target.checked); }}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">
                    {t.settings.documents.encryption.wizard.terms.acceptLimitations}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t.settings.documents.encryption.wizard.cancel}
                  </button>
                )}
                <button
                  onClick={() => { setCurrentStep("auth"); }}
                  disabled={!termsAccepted || !downsideAccepted}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.settings.documents.encryption.wizard.terms.acceptButton}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Authentication */}
        {currentStep === "auth" && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t.settings.documents.encryption.wizard.auth.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.settings.documents.encryption.wizard.auth.subtitle}
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.documents.encryption.wizard.auth.currentPassword}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); }}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder={t.settings.documents.encryption.wizard.auth.currentPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => { setShowCurrentPassword(!showCurrentPassword); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirmation Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.settings.documents.encryption.wizard.auth.confirmationType}
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  Please type:{" "}
                  <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                    {REQUIRED_CONFIRMATION}
                  </code>
                </p>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => { setConfirmationText(e.target.value); }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  placeholder={t.settings.documents.encryption.wizard.auth.confirmationPlaceholder}
                />
                {confirmationText && !confirmationMatches && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    {t.settings.documents.encryption.wizard.auth.textNoMatch}
                  </p>
                )}
                {confirmationMatches && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    {t.settings.documents.encryption.wizard.auth.confirmed}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setCurrentStep("terms"); }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t.settings.documents.encryption.wizard.back}
                </button>
                <button
                  onClick={() => {
                    // TODO: Verify password with backend
                    setCurrentStep("password");
                  }}
                  disabled={!currentPassword || !confirmationMatches}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.settings.documents.encryption.wizard.auth.verifyButton}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Create Encryption Password */}
        {currentStep === "password" && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {t.settings.documents.encryption.wizard.password.title}
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {t.settings.documents.encryption.wizard.password.subtitle}
            </p>

            <div className="space-y-4">
              {/* Password Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t.settings.documents.encryption.wizard.password.encryptionPassword}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={encryptionPassword}
                    onChange={(e) => { setEncryptionPassword(e.target.value); }}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 pr-10 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={
                      t.settings.documents.encryption.wizard.password.encryptionPasswordPlaceholder
                    }
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t.settings.documents.encryption.wizard.password.confirmPassword}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); }}
                  className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t.settings.documents.encryption.wizard.password.confirmPasswordPlaceholder}
                />
              </div>

              {/* Password Strength Indicator */}
              {encryptionPassword && passwordStrength && (
                <div className="rounded-md bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t.settings.documents.encryption.wizard.password.strength}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength.score >= 75
                          ? "text-green-600"
                          : passwordStrength.score >= 50
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {passwordStrength.score}%
                    </span>
                  </div>
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength.score >= 75
                          ? "bg-green-500"
                          : passwordStrength.score >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="space-y-1">
                      {passwordStrength.feedback.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Password Match Indicator */}
              {confirmPassword && (
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t.settings.documents.encryption.wizard.password.passwordsMatch}
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      {t.settings.documents.encryption.wizard.password.passwordsNoMatch}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCurrentStep("auth"); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.settings.documents.encryption.wizard.back}
              </button>
              <button
                onClick={() => {
                  handleGeneratePhrase();
                  setCurrentStep("recovery");
                }}
                disabled={!passwordStrength?.isValid || !passwordsMatch}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.settings.documents.encryption.wizard.continue}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Save Recovery Phrase */}
        {currentStep === "recovery" && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {t.settings.documents.encryption.wizard.recovery.title}
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {t.settings.documents.encryption.wizard.recovery.subtitle}
            </p>

            {/* Recovery Phrase Display */}
            <div className="mb-6 rounded-lg bg-amber-50 p-6">
              <div className="mb-4 flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  {t.settings.documents.encryption.wizard.recovery.important}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-md bg-white border border-amber-200 p-4 font-mono text-sm">
                {recoveryPhrase.split(" ").map((word, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-gray-400">{idx + 1}.</span>
                    <span className="font-medium text-gray-900">{word}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleCopyPhrase}
                  className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied
                    ? t.settings.documents.encryption.wizard.recovery.copied
                    : t.settings.documents.encryption.wizard.recovery.copy}
                </button>
                <button
                  onClick={handleDownloadPhrase}
                  className="flex items-center gap-2 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4" />
                  {t.settings.documents.encryption.wizard.recovery.download}
                </button>
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 rounded-md border border-gray-300 p-4">
              <input
                type="checkbox"
                checked={phraseConfirmed}
                onChange={(e) => { setPhraseConfirmed(e.target.checked); }}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t.settings.documents.encryption.wizard.recovery.confirmSaved}
              </span>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCurrentStep("password"); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t.settings.documents.encryption.wizard.back}
              </button>
              <button
                onClick={() => { setCurrentStep("confirm"); }}
                disabled={!phraseConfirmed}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.settings.documents.encryption.wizard.continue}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Final Confirmation */}
        {currentStep === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {t.settings.documents.encryption.wizard.confirm.title}
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {t.settings.documents.encryption.wizard.confirm.subtitle}
            </p>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
              <h4 className="mb-3 font-medium text-blue-900">
                {t.settings.documents.encryption.wizard.confirm.whatHappens}
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {t.settings.documents.encryption.wizard.confirm.newFilesEncrypted}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {t.settings.documents.encryption.wizard.confirm.unlockRequired}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {t.settings.documents.encryption.wizard.confirm.noServerProcessing}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {t.settings.documents.encryption.wizard.confirm.membersOnly}
                </li>
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setCurrentStep("recovery"); }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isEnabling}
              >
                {t.settings.documents.encryption.wizard.back}
              </button>
              <button
                onClick={handleEnableEncryption}
                disabled={isEnabling}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isEnabling && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {isEnabling
                  ? t.settings.documents.encryption.wizard.confirm.enabling
                  : t.settings.documents.encryption.wizard.confirm.enableButton}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 6: Complete */}
        {currentStep === "complete" && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="mb-2 text-2xl font-semibold text-gray-900">
                {t.settings.documents.encryption.wizard.complete.title}
              </h3>
              <p className="mb-6 text-gray-600">{t.settings.documents.encryption.wizard.complete.subtitle}</p>

              <div className="w-full max-w-md rounded-lg bg-gray-50 border border-gray-200 p-6 text-left">
                <h4 className="mb-3 font-medium text-gray-900">
                  {t.settings.documents.encryption.wizard.complete.reminders}
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t.settings.documents.encryption.wizard.complete.sharePassword}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t.settings.documents.encryption.wizard.complete.keepRecovery}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {t.settings.documents.encryption.wizard.complete.unlockPrompt}
                  </li>
                </ul>
              </div>

              <button
                onClick={handleComplete}
                className="mt-6 rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                {t.settings.documents.encryption.wizard.complete.doneButton}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
