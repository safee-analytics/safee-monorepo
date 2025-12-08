"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, AlertCircle, Eye, EyeOff, Key } from "lucide-react";
import {
  deriveKeyFromPassword,
  deriveKeyFromRecoveryPhrase,
  unwrapOrgKey,
  validateRecoveryPhrase,
  unwrapOrgKeyWithRSA,
  importEncryptedPrivateKey,
} from "@/lib/crypto/cryptoService";
import { useEncryptionStore } from "@/stores/useEncryptionStore";

interface EncryptionUnlockPromptProps {
  organizationId: string;
  encryptionKeyId: string;
  wrappedOrgKey: string;
  salt: string;
  iv: string;
  onUnlock: () => void;
  onCancel: () => void;
}

export function EncryptionUnlockPrompt({
  organizationId: _organizationId,
  encryptionKeyId: _encryptionKeyId,
  wrappedOrgKey,
  salt,
  iv,
  onUnlock,
  onCancel,
}: EncryptionUnlockPromptProps) {
  const [unlockMethod, setUnlockMethod] = useState<"password" | "recovery">("password");
  const [password, setPassword] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState("");
  const [isAuditor] = useState(false);
  const [auditorAccess] = useState<{
    wrappedOrgKey: string;
    encryptedPrivateKey: string;
    privateKeySalt: string;
    privateKeyIv: string;
  } | null>(null);

  const { unlock } = useEncryptionStore();

  // TODO: Check if user has auditor access on mount
  // useEffect(() => {
  //   const checkAuditorAccess = async () => {
  //     try {
  //       const { data, error } = await apiClient.GET("/encryption/auditor-access", {
  //         params: {
  //           query: { organizationId, encryptionKeyId },
  //         },
  //       });
  //       if (data && !error) {
  //         setAuditorAccess(data);
  //         setIsAuditor(true);
  //       }
  //     } catch (err) {
  //       console.error("Failed to check auditor access:", err);
  //     }
  //   };
  //   checkAuditorAccess();
  // }, [organizationId, encryptionKeyId]);

  const handlePasswordUnlock = async () => {
    try {
      setIsUnlocking(true);
      setError("");

      if (!password) {
        setError("Password is required");
        return;
      }

      // Derive master key from password
      const masterKey = await deriveKeyFromPassword(password, salt);

      // Unwrap org key
      const orgKey = await unwrapOrgKey(wrappedOrgKey, iv, masterKey);

      // Store keys in memory
      unlock(orgKey, masterKey);

      // Clear password from memory
      setPassword("");

      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRecoveryPhraseUnlock = async () => {
    try {
      setIsUnlocking(true);
      setError("");

      if (!recoveryPhrase) {
        setError("Recovery phrase is required");
        return;
      }

      // Validate recovery phrase format
      if (!validateRecoveryPhrase(recoveryPhrase)) {
        setError("Invalid recovery phrase. Must be 12 words separated by spaces.");
        return;
      }

      // Derive master key from recovery phrase
      const masterKey = await deriveKeyFromRecoveryPhrase(recoveryPhrase, salt);

      // Unwrap org key
      const orgKey = await unwrapOrgKey(wrappedOrgKey, iv, masterKey);

      // Store keys in memory
      unlock(orgKey, masterKey);

      // Clear recovery phrase from memory
      setRecoveryPhrase("");

      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid recovery phrase");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleAuditorUnlock = async () => {
    try {
      setIsUnlocking(true);
      setError("");

      if (!password) {
        setError("Password is required to decrypt your private key");
        return;
      }

      if (!auditorAccess) {
        setError("Auditor access not found");
        return;
      }

      // Import auditor's encrypted private key
      const privateKey = await importEncryptedPrivateKey(
        auditorAccess.encryptedPrivateKey,
        auditorAccess.privateKeyIv,
        password,
        auditorAccess.privateKeySalt,
      );

      // Unwrap org key using RSA private key
      const orgKey = await unwrapOrgKeyWithRSA(auditorAccess.wrappedOrgKey, privateKey);

      // Derive master key for completeness (auditors don't have real master key)
      const masterKey = await deriveKeyFromPassword(password, salt);

      // Store keys in memory
      unlock(orgKey, masterKey);

      // Clear password from memory
      setPassword("");

      onUnlock();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock with auditor access");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlock = () => {
    if (isAuditor && auditorAccess) {
      handleAuditorUnlock();
    } else if (unlockMethod === "password") {
      handlePasswordUnlock();
    } else {
      handleRecoveryPhraseUnlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Unlock Encrypted Files
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAuditor
                ? "You have auditor access to decrypt files"
                : "Enter your encryption password to access encrypted files"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isAuditor && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setUnlockMethod("password")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                unlockMethod === "password"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <Key className="mr-2 inline h-4 w-4" />
              Password
            </button>
            <button
              onClick={() => setUnlockMethod("recovery")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                unlockMethod === "recovery"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              <Key className="mr-2 inline h-4 w-4" />
              Recovery Phrase
            </button>
          </div>
        )}

        <div className="mb-4">
          {unlockMethod === "password" || isAuditor ? (
            <>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {isAuditor ? "Password (to decrypt your private key)" : "Encryption Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Recovery Phrase
              </label>
              <textarea
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your 12-word recovery phrase"
                rows={3}
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Separate each word with a space
              </p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isUnlocking}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel and Logout
          </button>
          <button
            onClick={handleUnlock}
            disabled={
              isUnlocking ||
              (unlockMethod === "password" && !password) ||
              (unlockMethod === "recovery" && !recoveryPhrase)
            }
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnlocking ? "Unlocking..." : "Unlock"}
          </button>
        </div>

        {isAuditor && (
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <p className="font-medium">Auditor Access</p>
            <p className="mt-1 text-xs">
              You have been granted temporary access to decrypt organization files without the
              organization password.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
