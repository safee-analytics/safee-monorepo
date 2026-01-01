"use client";

import { useState } from "react";
import { UserCheck, Shield, Trash2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import {
  type AuditorAccess,
  type AvailableAuditor,
  auditorAccessSchema,
  availableAuditorSchema,
} from "@/lib/validation";
import {
  deriveKeyFromPassword,
  unwrapOrgKey,
  importPublicKeyFromPEM,
  wrapOrgKeyWithRSA,
} from "@/lib/crypto/cryptoService";

interface AuditorAccessManagerProps {
  organizationId: string;
  encryptionKeyId: string;
  wrappedOrgKey: string;
  salt: string;
  iv: string;
}

export function AuditorAccessManager({
  organizationId: _organizationId,
  encryptionKeyId: _encryptionKeyId,
  wrappedOrgKey,
  salt,
  iv,
}: AuditorAccessManagerProps) {
  const [auditorAccesses, setAuditorAccesses] = useState<AuditorAccess[]>([]);
  const [selectedAuditor, setSelectedAuditor] = useState("");
  const [accessDuration, setAccessDuration] = useState("30"); // days
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState("");

  // TODO: [Backend/Frontend] - Fetch available auditors from API
  //   Details: The `availableAuditors` list is currently mocked. Implement a backend API endpoint to fetch a real list of auditors and integrate it here.
  //   Priority: High
  const availableAuditors: AvailableAuditor[] = availableAuditorSchema.array().parse([
    { id: "1", name: "John Auditor", email: "john@audit.com" },
    { id: "2", name: "Jane Auditor", email: "jane@audit.com" },
  ]);

  const handleGrantAccess = async () => {
    try {
      setIsGranting(true);
      setError("");

      if (!password) {
        setError("Password is required");
        return;
      }

      // 1. Derive master key from password
      const masterKey = await deriveKeyFromPassword(password, salt);

      // 2. Unwrap org key
      const orgKey = await unwrapOrgKey(wrappedOrgKey, iv, masterKey);

      // 3. Fetch auditor's RSA public key
      const auditor = availableAuditors.find((a) => a.id === selectedAuditor);
      if (!auditor) {
        setError("Invalid auditor selected");
        return;
      }

      // TODO: [Backend] - Fetch real public key from backend for the selected auditor
      //   Details: The `publicKeyPEM` is currently mocked. Implement a backend API endpoint (e.g., `/api/v1/users/${selectedAuditor}/public-key`) to retrieve the actual RSA public key of the selected auditor.
      //   Priority: High
      // const response = await fetch(`/api/v1/users/${selectedAuditor}/public-key`);
      // const { publicKey: publicKeyPEM } = await response.json();
      const publicKeyPEM = "-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----";

      const publicKey = await importPublicKeyFromPEM(publicKeyPEM);

      // 4. Wrap org key with auditor's RSA public key
      const _wrappedKeyForAuditor = await wrapOrgKeyWithRSA(orgKey, publicKey);

      // 5. Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(accessDuration));

      // 6. Send to backend
      // TODO: [Backend/Frontend] - Implement API call to grant auditor access
      //   Details: Implement the backend API endpoint (e.g., `POST /api/v1/encryption/auditor-access`) to persist the granted auditor access. This involves sending the `organizationId`, `auditorUserId`, `encryptionKeyId`, `wrappedOrgKey` (for the auditor), and `expiresAt`.
      //   Priority: High
      // await fetch('/api/v1/encryption/auditor-access', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     organizationId,
      //     auditorUserId: selectedAuditor,
      //     encryptionKeyId,
      //     wrappedOrgKey: wrappedKeyForAuditor,
      //     expiresAt: expiresAt.toISOString(),
      //   }),
      // });

      // Mock: Add to local state
      const newAccess: AuditorAccess = auditorAccessSchema.parse({
        id: crypto.randomUUID(),
        auditorUserId: selectedAuditor,
        auditorName: auditor.name,
        auditorEmail: auditor.email,
        grantedBy: "Current User",
        grantedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        isRevoked: false,
      });

      setAuditorAccesses([...auditorAccesses, newAccess]);
      setShowPasswordPrompt(false);
      setPassword("");
      setSelectedAuditor("");
      setAccessDuration("30");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grant access");
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm("Are you sure you want to revoke this auditor's access?")) {
      return;
    }

    try {
      // TODO: [Backend/Frontend] - Implement API call to revoke auditor access
      //   Details: Implement the backend API endpoint (e.g., `DELETE /api/v1/encryption/auditor-access/${accessId}`) to revoke an auditor's access. Update this frontend logic to call the actual API.
      //   Priority: High
      // await fetch(`/api/v1/encryption/auditor-access/${accessId}`, {
      //   method: 'DELETE',
      // });

      setAuditorAccesses(
        auditorAccesses.map((access) => (access.id === accessId ? { ...access, isRevoked: true } : access)),
      );
    } catch (_err) {
      alert("Failed to revoke access");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Grant Access Section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grant Auditor Access</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Allow auditors to decrypt files without sharing your password
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Auditor Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Auditor
            </label>
            <select
              value={selectedAuditor}
              onChange={(e) => {
                setSelectedAuditor(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Choose an auditor...</option>
              {availableAuditors.map((auditor) => (
                <option key={auditor.id} value={auditor.id}>
                  {auditor.name} ({auditor.email})
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Duration (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={accessDuration}
              onChange={(e) => {
                setAccessDuration(e.target.value);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button
            onClick={() => {
              setShowPasswordPrompt(true);
            }}
            disabled={!selectedAuditor}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Grant Access
          </button>
        </div>
      </div>

      {/* Active Access List */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Auditor Access</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {auditorAccesses.filter((a) => !a.isRevoked).length} active grant
              {auditorAccesses.filter((a) => !a.isRevoked).length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {auditorAccesses.length === 0 ? (
          <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
            No auditor access granted yet
          </div>
        ) : (
          <div className="space-y-3">
            {auditorAccesses.map((access) => (
              <div
                key={access.id}
                className={`rounded-lg border p-4 ${
                  access.isRevoked
                    ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50"
                    : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{access.auditorName}</h4>
                      {access.isRevoked && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{access.auditorEmail}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Granted: {formatDate(access.grantedAt)}</span>
                      {access.expiresAt && <span>Expires: {formatDate(access.expiresAt)}</span>}
                      <span>By: {access.grantedBy}</span>
                    </div>
                  </div>
                  {!access.isRevoked && (
                    <button
                      onClick={() => {
                        void handleRevokeAccess(access.id);
                      }}
                      className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Revoke access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Your Password</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter your encryption password to grant access
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Encryption Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleGrantAccess();
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword("");
                  setError("");
                }}
                disabled={isGranting}
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleGrantAccess();
                }}
                disabled={isGranting || !password}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGranting ? "Granting..." : "Confirm"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
