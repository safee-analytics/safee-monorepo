/**
 * Notifications Hook
 * Subscribes to real-time user notifications
 */

import { useEffect, useCallback } from 'react';
import { useWebSocketContext } from './WebSocketProvider';
import { authClient } from '@/lib/auth/client';
import type { NotificationEvent } from '@safee/database';

export function useNotifications(onNotification: (notification: NotificationEvent) => void) {
  const { subscribe } = useWebSocketContext();

  const handleNotification = useCallback(
    (data: NotificationEvent) => {
      onNotification(data);
    },
    [onNotification],
  );

  useEffect(() => {
    // Get current user from session
    authClient.getSession().then((session) => {
      if (!session?.data?.user) return;

      const channel = `user:${session.data.user.id}`;
      const unsubscribe = subscribe(channel, 'notification', handleNotification);

      return () => {
        unsubscribe?.();
      };
    });
  }, [subscribe, handleNotification]);
}
