/**
 * Encryption State Store
 *
 * Manages in-memory encryption keys and lock state.
 * CRITICAL: Keys are NEVER persisted to localStorage or any storage.
 * Keys only exist in memory and are cleared on logout or lock.
 */

import { create } from "zustand";

interface EncryptionState {
  orgKey: CryptoKey | null;

  masterKey: CryptoKey | null;

  isUnlocked: boolean;

  setOrgKey: (key: CryptoKey) => void;
  setMasterKey: (key: CryptoKey) => void;
  lock: () => void;
  clearKeys: () => void;
  unlock: (orgKey: CryptoKey, masterKey: CryptoKey) => void;
}

/**
 * Encryption store - manages encryption keys in memory only
 *
 * SECURITY NOTES:
 * - Keys are stored only in JavaScript memory
 * - Keys are NOT persisted to localStorage, sessionStorage, or cookies
 * - Keys are cleared when user locks or logs out
 * - Keys are cleared when browser tab closes
 */
export const useEncryptionStore = create<EncryptionState>((set) => ({
  orgKey: null,
  masterKey: null,
  isUnlocked: false,

  setOrgKey: (key) => {
    set({ orgKey: key });
  },

  setMasterKey: (key) => {
    set({ masterKey: key });
  },

  lock: () => {
    set({
      orgKey: null,
      masterKey: null,
      isUnlocked: false,
    });
  },

  clearKeys: () => {
    set({
      orgKey: null,
      masterKey: null,
      isUnlocked: false,
    });
  },

  unlock: (orgKey, masterKey) => {
    set({
      orgKey,
      masterKey,
      isUnlocked: true,
    });
  },
}));

/**
 * Hook to check if encryption is available and unlocked
 */
export function useEncryptionStatus(): {
  isUnlocked: boolean;
  hasOrgKey: boolean;
  hasMasterKey: boolean;
  canEncrypt: boolean;
} {
  const { isUnlocked, orgKey, masterKey } = useEncryptionStore();

  return {
    isUnlocked,
    hasOrgKey: orgKey !== null,
    hasMasterKey: masterKey !== null,
    canEncrypt: isUnlocked && orgKey !== null,
  };
}
