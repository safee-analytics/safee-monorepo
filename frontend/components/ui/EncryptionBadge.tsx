import { Lock } from "lucide-react";

interface EncryptionBadgeProps {
  encrypted: boolean;
  className?: string;
}

export function EncryptionBadge({ encrypted, className = "" }: EncryptionBadgeProps) {
  if (!encrypted) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400 ${className}`}
      title="This file is encrypted and can only be accessed by organization members"
    >
      <Lock className="h-3 w-3" />
      Encrypted
    </span>
  );
}
