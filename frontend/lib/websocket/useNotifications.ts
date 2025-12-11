/**
 * Notifications Hook
 * Subscribes to real-time user notifications
 */

import { useEffect, useCallback } from "react";
import { useWebSocketContext } from "./WebSocketProvider";
import { authClient } from "@/lib/auth/client";
import type { NotificationEvent } from "@safee/database";

export function useNotifications(onNotification: (notification: NotificationEvent) => void) {
  const { subscribe } = useWebSocketContext();

  const handleNotification = useCallback(
    (data: NotificationEvent) => {
      onNotification(data);
    },
    [onNotification],
  );

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      // Get current user from session
      const session = await authClient.getSession();
      if (!isMounted || !session?.data?.user) return;

      const channel = `user:${session.data.user.id}`;
      unsubscribe = subscribe(channel, "notification", handleNotification);
    };

    void init();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [subscribe, handleNotification]);
}
