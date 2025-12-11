"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, RefreshCw, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { deriveKeyFromPassword, unwrapOrgKey } from "@/lib/crypto/cryptoService";
import { encryptedStorageService } from "@/lib/services/encryptedStorageService";
import { useEncryptionStore } from "@/stores/useEncryptionStore";

interface ReencryptionProgressProps {
  organizationId: string;
  wrappedOrgKey: string;
  salt: string;
  iv: string;
}

interface FileToEncrypt {
  id: string;
  name: string;
  size: number;
  status: "pending" | "encrypting" | "completed" | "failed";
  error?: string;
}

interface MigrationStats {
  total: number;
  encrypted: number;
  pending: number;
  failed: number;
}

export function ReencryptionProgress({
  organizationId: _organizationId,
  wrappedOrgKey,
  salt,
  iv,
}: ReencryptionProgressProps) {
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState("");

  const [stats, setStats] = useState<MigrationStats>({
    total: 0,
    encrypted: 0,
    pending: 0,
    failed: 0,
  });

  const [files, setFiles] = useState<FileToEncrypt[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const { setOrgKey, setMasterKey } = useEncryptionStore();

  // Load migration status on mount
  // TODO: Fetch from API
  // useEffect(() => {
  //   const fetchStatus = async () => {
  //     const { data } = await apiClient.GET("/encryption/reencryption-status");
  //     if (data) {
  //       setStats(data.stats);
  //     }
  //   };
  //   fetchStatus();
  // }, []);

  const handleStartMigration = async () => {
    try {
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
      setOrgKey(orgKey);
      setMasterKey(masterKey);

      // Fetch list of unencrypted files
      // TODO: Replace with actual API call
      // const { data } = await apiClient.GET("/storage/files", {
      //   params: { query: { encrypted: false, limit: 1000 } },
      // });

      // Mock files for testing
      const mockFiles: FileToEncrypt[] = [
        { id: "1", name: "document1.pdf", size: 1024000, status: "pending" },
        { id: "2", name: "invoice.xlsx", size: 512000, status: "pending" },
        { id: "3", name: "report.docx", size: 2048000, status: "pending" },
      ];

      setFiles(mockFiles);
      setStats({
        total: mockFiles.length,
        encrypted: 0,
        pending: mockFiles.length,
        failed: 0,
      });

      setShowPasswordPrompt(false);
      setPassword("");
      setIsRunning(true);
      setCurrentFileIndex(0);

      // Start processing files
      await processNextFile(mockFiles, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start migration");
    }
  };

  const processNextFile = async (fileList: FileToEncrypt[], index: number) => {
    if (index >= fileList.length || isPaused) {
      setIsRunning(false);
      return;
    }

    const file = fileList[index];

    // Update file status to encrypting
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "encrypting" } : f)));
    setCurrentFileIndex(index);

    try {
      // TODO: Download file, encrypt it, re-upload
      // For now, simulate encryption
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock: Create a File object for testing
      const mockFileBlob = new Blob(["test content"], { type: "application/octet-stream" });
      const mockFile = new File([mockFileBlob], file.name);

      // Encrypt and upload
      await encryptedStorageService.uploadEncryptedFile(mockFile, {
        // Replace existing file
      });

      // Update file status to completed
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "completed" } : f)));

      setStats((prev) => ({
        ...prev,
        encrypted: prev.encrypted + 1,
        pending: prev.pending - 1,
      }));

      // Process next file
      setTimeout(() => {
        void processNextFile(fileList, index + 1);
      }, 500);
    } catch (err) {
      // Update file status to failed
      const errorMessage = err instanceof Error ? err.message : "Encryption failed";
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: "failed", error: errorMessage } : f)),
      );

      setStats((prev) => ({
        ...prev,
        failed: prev.failed + 1,
        pending: prev.pending - 1,
      }));

      // Continue with next file
      setTimeout(() => {
        void processNextFile(fileList, index + 1);
      }, 500);
    }
  };

  const handlePauseResume = () => {
    if (isRunning) {
      setIsPaused(true);
      setIsRunning(false);
    } else {
      setIsPaused(false);
      setIsRunning(true);
      void processNextFile(files, currentFileIndex);
    }
  };

  const completionPercentage =
    stats.total > 0 ? Math.round(((stats.encrypted + stats.failed) / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Migration Stats */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              File Re-encryption Progress
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Encrypt existing files with organization encryption key
            </p>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Files</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <p className="text-sm text-green-600 dark:text-green-400">Encrypted</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.encrypted}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.failed}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completionPercentage}%
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isRunning && !isPaused && stats.pending > 0 && (
            <button
              onClick={() => {
                setShowPasswordPrompt(true);
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Start Re-encryption
            </button>
          )}
          {(isRunning || isPaused) && (
            <button
              onClick={() => {
                handlePauseResume();
              }}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              {isRunning ? "Pause" : "Resume"}
            </button>
          )}
        </div>

        {isRunning && (
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <p className="font-medium">⚠️ Keep this tab open</p>
            <p className="mt-1">
              Re-encryption happens in your browser. Closing this tab will pause the process.
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Files Being Processed</h4>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  file.status === "completed"
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : file.status === "failed"
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : file.status === "encrypting"
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50"
                }`}
              >
                <div className="flex flex-1 items-center gap-3">
                  {file.status === "completed" && (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                  {file.status === "failed" && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                  {file.status === "encrypting" && (
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                  )}
                  {file.status === "pending" && (
                    <AlertCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024).toFixed(2)} KB
                      {file.error && ` • ${file.error}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    file.status === "completed"
                      ? "text-green-700 dark:text-green-300"
                      : file.status === "failed"
                        ? "text-red-700 dark:text-red-300"
                        : file.status === "encrypting"
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {file.status === "completed"
                    ? "Encrypted"
                    : file.status === "failed"
                      ? "Failed"
                      : file.status === "encrypting"
                        ? "Encrypting..."
                        : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  Enter your encryption password to start re-encryption
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
                      void handleStartMigration();
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
                className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleStartMigration();
                }}
                disabled={!password}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
