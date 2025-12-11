/**
 * Core Socket.IO Hook with Better Auth Integration
 * Provides session-aware Socket.IO connection with automatic reconnection
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { authClient } from "@/lib/auth/client";

interface UseWebSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, onConnect, onDisconnect, onError } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventHandlers = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  const connect = useCallback(async () => {
    if (!enabled || socketRef.current?.connected) return;

    try {
      // Check if user has active session
      const session = await authClient.getSession();
      if (!session?.data) {
        return;
      }

      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://app.localhost:8080";

      // Create Socket.IO client with cookie-based auth
      const socket = io(apiUrl, {
        path: "/socket.io",
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ["websocket", "polling"],
      });

      // Connection events
      socket.on("connect", () => {
        setIsConnected(true);
        setReconnectCount(0);
        onConnect?.();
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
        onDisconnect?.();
      });

      socket.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error.message);
        setReconnectCount((prev) => prev + 1);
        onError?.(error);
      });

      // Handle server errors
      socket.on("error", (error) => {
        console.error("Socket.IO server error:", error);
      });

      // Register all existing event handlers
      for (const [event, handlers] of eventHandlers.current.entries()) {
        socket.on(event, (data) => {
          for (const handler of handlers) handler(data);
        });
      }

      socketRef.current = socket;
    } catch (err) {
      console.error("Socket.IO connection error:", err);
    }
  }, [enabled, onConnect, onDisconnect, onError]);

  const subscribe = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T = any>(channel: string, event: string, handler: (data: T) => void) => {
      if (!enabled) return;

      const eventKey = event;

      // Register handler
      if (!eventHandlers.current.has(eventKey)) {
        eventHandlers.current.set(eventKey, new Set());
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eventHandlers.current.get(eventKey)!.add(handler as (data: any) => void);

      // If socket is connected, register the listener
      if (socketRef.current?.connected) {
        socketRef.current.on(eventKey, handler);

        // Only send subscribe message if it's a custom channel (not auto-joined)
        if (!channel.startsWith("user:") && !channel.startsWith("org:")) {
          socketRef.current.emit("subscribe", channel);
        }
      }

      // Return unsubscribe function
      return () => {
        eventHandlers.current.get(eventKey)?.delete(handler);

        if (socketRef.current?.connected) {
          socketRef.current.off(eventKey, handler);

          // If no more handlers for this event, unsubscribe from channel
          if (eventHandlers.current.get(eventKey)?.size === 0) {
            eventHandlers.current.delete(eventKey);
            if (!channel.startsWith("user:") && !channel.startsWith("org:")) {
              socketRef.current.emit("unsubscribe", channel);
            }
          }
        }
      };
    },
    [enabled],
  );

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    void connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { isConnected, subscribe, disconnect, reconnectCount };
}
