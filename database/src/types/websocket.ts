import type { NotificationType } from "../drizzle/_common.js";

export type SocketChannel = `user:${string}` | `org:${string}` | `upload:${string}` | "admin:all";

export interface ConnectedEvent {
  userId: string;
  organizationId: string | null;
  rooms: string[];
}

export interface SubscribedEvent {
  channel: SocketChannel;
}

export interface UnsubscribedEvent {
  channel: SocketChannel;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  actionLabel: string | null;
  actionUrl: string | null;
}

export interface ActivityEvent {
  id?: string;
  type: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface UploadProgressEvent {
  fileId: string;
  stage: "encrypting" | "uploading" | "completed" | "error";
  percentage: number;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ReEncryptionProgressEvent {
  completed: number;
  total: number;
  failed: number;
  currentFile?: string;
  estimatedTimeRemaining?: number;
}

export interface AdminBroadcastEvent {
  type: string;
  message: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface PresenceEvent {
  userId: string;
  userName: string;
  status: "online" | "away" | "offline";
  lastSeen: string;
}

export interface TypingEvent {
  userId: string;
  userName: string;
  documentId: string;
  isTyping: boolean;
}

export interface ServerToClientEvents {
  connected: (data: ConnectedEvent) => void;
  subscribed: (data: SubscribedEvent) => void;
  unsubscribed: (data: UnsubscribedEvent) => void;
  error: (data: ErrorEvent) => void;
  notification: (data: NotificationEvent) => void;
  activity: (data: ActivityEvent) => void;
  progress: (data: UploadProgressEvent) => void;
  "re-encryption-progress": (data: ReEncryptionProgressEvent) => void;
  "admin-broadcast": (data: AdminBroadcastEvent) => void;
  presence: (data: PresenceEvent) => void;
  typing: (data: TypingEvent) => void;
}

export interface ClientToServerEvents {
  subscribe: (channel: SocketChannel) => void;
  unsubscribe: (channel: SocketChannel) => void;
  ping: () => void;
}

export interface SocketData {
  userId: string;
  organizationId: string | null;
  sessionId: string;
  email: string;
  role: string;
}

export interface BroadcastOptions {
  requireRole?: string;
  excludeUser?: string;
}

export function isUserChannel(channel: string): channel is `user:${string}` {
  return channel.startsWith("user:");
}

export function isOrgChannel(channel: string): channel is `org:${string}` {
  return channel.startsWith("org:");
}

export function isUploadChannel(channel: string): channel is `upload:${string}` {
  return channel.startsWith("upload:");
}

export function isAdminChannel(channel: string): channel is "admin:all" {
  return channel === "admin:all";
}
