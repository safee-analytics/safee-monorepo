/**
 * Socket.IO Service with Better Auth Integration
 * Provides secure real-time communication with session-based authentication
 * and Redis adapter for horizontal scaling
 */

import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { instrument } from "@socket.io/admin-ui";
import { auth } from "../../auth/index.js";
import { fromNodeHeaders } from "better-auth/node";
import pino from "pino";
import type { Server as HTTPServer } from "node:http";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  BroadcastOptions,
  SocketChannel,
} from "@safee/database";

const logger = pino({ name: "socket.io" });

interface AuthenticatedSocket
  extends Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
  data: SocketData;
}

export class WebSocketService {
  private io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
  private pubClient: ReturnType<typeof createClient> | null = null;
  private subClient: ReturnType<typeof createClient> | null = null;

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.IO with security options
    this.io = new Server(httpServer, {
      path: "/socket.io",
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") ?? [
          "http://app.localhost:8080",
          "http://localhost:3001",
        ],
        credentials: true,
      },
      // Connection options
      pingTimeout: 30000,
      pingInterval: 25000,
      // Performance
      perMessageDeflate: {
        threshold: 1024,
      },
      maxHttpBufferSize: 1e6, // 1MB
      allowEIO3: false, // Disable older protocol
    });

    // Setup Redis adapter for horizontal scaling
    void this.setupRedisAdapter();

    // Authentication middleware
    this.setupAuthentication();

    // Connection handler
    this.setupConnectionHandler();

    // Setup admin UI (only in development)
    if (process.env.NODE_ENV === "development") {
      this.setupAdminUI();
    }

    logger.info("Socket.IO server initialized with Better Auth and Redis");
  }

  /**
   * Setup Redis adapter for multi-server scaling
   */
  private async setupRedisAdapter() {
    try {
      const redisUrl = process.env.REDIS_URL ?? "redis://localhost:16379";

      // Create Redis clients for pub/sub
      this.pubClient = createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();

      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      // Attach Redis adapter to Socket.IO
      this.io.adapter(createAdapter(this.pubClient, this.subClient));

      logger.info({ redisUrl }, "Socket.IO Redis adapter connected");
    } catch (err) {
      logger.error({ error: err }, "Failed to setup Redis adapter - running without clustering support");
      // Continue without Redis - Socket.IO will use in-memory adapter
    }
  }

  /**
   * Setup Better Auth authentication middleware
   */
  private setupAuthentication() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      void (async () => {
        try {
          // Extract Better Auth session from cookies
          const headers = fromNodeHeaders(socket.request.headers);
          const session = await auth.api.getSession({ headers });

          if (!session?.user) {
            logger.warn("Socket.IO connection rejected - no valid session");
            next(new Error("Unauthorized"));
            return;
          }

          // Attach user data to socket
          socket.data = {
            userId: session.user.id,
            organizationId: session.session.activeOrganizationId ?? null,
            sessionId: session.session.id,
            email: session.user.email,
            role: session.user.role ?? "user",
          };

          logger.info(
            {
              userId: socket.data.userId,
              organizationId: socket.data.organizationId,
              email: socket.data.email,
            },
            "Socket.IO connection authorized",
          );

          next();
        } catch (err) {
          logger.error({ error: err }, "Socket.IO authentication error");
          next(new Error("Authentication failed"));
        }
      })();
    });
  }

  /**
   * Setup Socket.IO Admin UI (development only)
   */
  private setupAdminUI() {
    try {
      instrument(this.io, {
        auth: false, // Disable auth in development for easy testing
        mode: "development",
      });

      logger.info("Socket.IO Admin UI enabled");
      logger.info("Visit: https://admin.socket.io/#/ and connect to http://app.localhost:8080");
    } catch (err) {
      logger.warn({ error: err }, "Failed to setup Socket.IO Admin UI - continuing without it");
      // Continue without admin UI - not critical for operation
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandler() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const { userId, organizationId, email } = socket.data;

      logger.info(
        {
          userId,
          organizationId,
          email,
          socketId: socket.id,
          totalConnections: this.io.engine.clientsCount,
        },
        "Client connected to Socket.IO",
      );

      // Auto-join user room (for user-specific notifications)
      void socket.join(`user:${userId}`);

      // Auto-join organization room (for org-wide broadcasts)
      if (organizationId) {
        void socket.join(`org:${organizationId}`);
      }

      // Auto-join admin room if user is admin
      if (socket.data.role === "admin") {
        void socket.join("admin:all");
      }

      // Send welcome message with subscriptions
      socket.emit("connected", {
        userId,
        organizationId,
        rooms: Array.from(socket.rooms).filter((room) => room !== socket.id),
      });

      // Handle custom room subscriptions
      socket.on("subscribe", (channel: SocketChannel) => {
        this.handleSubscribe(socket, channel);
      });

      socket.on("unsubscribe", (channel: SocketChannel) => {
        this.handleUnsubscribe(socket, channel);
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        logger.info(
          {
            userId,
            organizationId,
            socketId: socket.id,
            reason,
            remainingConnections: this.io.engine.clientsCount - 1,
          },
          "Client disconnected from Socket.IO",
        );
      });

      // Handle errors
      socket.on("error", (error) => {
        logger.error({ error, userId, socketId: socket.id }, "Socket.IO error");
      });
    });
  }

  /**
   * Handle subscription with authorization
   */
  private handleSubscribe(socket: AuthenticatedSocket, channel: SocketChannel) {
    if (!this.canSubscribe(socket, channel)) {
      logger.warn({ userId: socket.data.userId, channel }, "Subscription denied - insufficient permissions");
      socket.emit("error", {
        message: `Not authorized to subscribe to ${channel}`,
      });
      return;
    }

    void socket.join(channel);
    socket.emit("subscribed", { channel });

    logger.debug(
      { userId: socket.data.userId, channel, socketId: socket.id },
      "Client subscribed to channel",
    );
  }

  /**
   * Check if socket can subscribe to a channel
   */
  private canSubscribe(socket: AuthenticatedSocket, channel: SocketChannel): boolean {
    // User can only subscribe to their own user channel
    if (channel.startsWith("user:")) {
      const targetUserId = channel.split(":")[1];
      return targetUserId === socket.data.userId;
    }

    // User can only subscribe to their organization channel
    if (channel.startsWith("org:")) {
      const targetOrgId = channel.split(":")[1];
      return targetOrgId === socket.data.organizationId;
    }

    // File upload channels - allow for now
    if (channel.startsWith("upload:")) {
      return true;
    }

    // Admin-only channels
    if (channel.startsWith("admin:")) {
      return socket.data.role === "admin";
    }

    // Deny all other channels
    return false;
  }

  /**
   * Handle unsubscribe
   */
  private handleUnsubscribe(socket: AuthenticatedSocket, channel: SocketChannel) {
    // Don't allow unsubscribing from user channel
    if (channel === `user:${socket.data.userId}`) {
      socket.emit("error", {
        message: "Cannot unsubscribe from user channel",
      });
      return;
    }

    void socket.leave(channel);
    socket.emit("unsubscribed", { channel });

    logger.debug(
      { userId: socket.data.userId, channel, socketId: socket.id },
      "Client unsubscribed from channel",
    );
  }

  // ============ Public Broadcasting API ============

  /**
   * Broadcast to a specific channel/room
   */
  public broadcast<K extends keyof ServerToClientEvents>(
    channel: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ) {
    this.io.to(channel).emit(event, ...args);
    logger.debug({ channel, event }, "Broadcast sent to channel");
  }

  /**
   * Broadcast to a specific user (all their connections)
   */
  public broadcastToUser<K extends keyof ServerToClientEvents>(
    userId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ) {
    this.io.to(`user:${userId}`).emit(event, ...args);
    logger.debug({ userId, event }, "Broadcast sent to user");
  }

  /**
   * Broadcast to an entire organization
   */
  public broadcastToOrg<K extends keyof ServerToClientEvents>(
    organizationId: string,
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ) {
    this.io.to(`org:${organizationId}`).emit(event, ...args);
    logger.debug({ organizationId, event }, "Broadcast sent to org");
  }

  /**
   * Broadcast to all admin users
   */
  public broadcastToAdmins<K extends keyof ServerToClientEvents>(
    event: K,
    ...args: Parameters<ServerToClientEvents[K]>
  ) {
    this.io.to("admin:all").emit(event, ...args);
    logger.debug({ event }, "Broadcast sent to admins");
  }

  /**
   * Get connection stats
   */
  public async getStats() {
    const sockets = await this.io.fetchSockets();
    const rooms = new Map<string, number>();

    for (const socket of sockets) {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          rooms.set(room, (rooms.get(room) ?? 0) + 1);
        }
      }
    }

    return {
      totalConnections: this.io.engine.clientsCount,
      totalSockets: sockets.length,
      roomCount: rooms.size,
      rooms: Array.from(rooms.entries()).map(([room, count]) => ({
        room,
        subscribers: count,
      })),
    };
  }

  /**
   * Graceful shutdown
   */
  public async shutdown() {
    logger.info("Shutting down Socket.IO server gracefully");

    // Close all socket connections
    const sockets = await this.io.fetchSockets();
    for (const socket of sockets) {
      socket.disconnect(true);
    }

    // Close Socket.IO server
    void this.io.close();

    // Close Redis connections
    if (this.pubClient) {
      await this.pubClient.quit();
    }
    if (this.subClient) {
      await this.subClient.quit();
    }

    logger.info("Socket.IO server shut down");
  }

  /**
   * Get Socket.IO instance (for advanced usage)
   */
  public getIO(): Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> {
    return this.io;
  }
}

export type { ServerToClientEvents, ClientToServerEvents, SocketData, BroadcastOptions, SocketChannel };
