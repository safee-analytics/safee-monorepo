/**
 * WebSocket Provider - Global WebSocket Connection
 * Wraps the app to provide WebSocket context to all components
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "./useWebSocket";

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: <T>(channel: string, event: string, handler: (data: T) => void) => (() => void) | undefined;
  disconnect: () => void;
  reconnectCount: number;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const ws = useWebSocket({
    onError: (error) => { console.error("WebSocket error:", error); },
  });

  return <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}
