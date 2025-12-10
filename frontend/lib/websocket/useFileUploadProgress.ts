/**
 * File Upload Progress Hook
 * Subscribes to real-time file upload progress updates
 */

import { useEffect } from "react";
import { useWebSocketContext } from "./WebSocketProvider";
import type { UploadProgressEvent } from "@safee/database";

export function useFileUploadProgress(
  fileId: string | null,
  onProgress: (progress: UploadProgressEvent) => void,
) {
  const { subscribe } = useWebSocketContext();

  useEffect(() => {
    if (!fileId) return;

    const channel = `upload:${fileId}`;
    const unsubscribe = subscribe(channel, "progress", onProgress);

    return unsubscribe;
  }, [fileId, subscribe, onProgress]);
}
