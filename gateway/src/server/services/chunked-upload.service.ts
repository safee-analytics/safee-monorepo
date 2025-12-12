/**
 * Chunked Upload Service
 * Handles large file uploads via chunking with session management,
 * resumability, and real-time WebSocket progress tracking
 */

// / <reference types="node" />

import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "node:fs";
import path from "node:path";
import { logger } from "../utils/logger.js";
import type { WebSocketService } from "./websocket.service.js";

export interface UploadSession {
  id: string;
  userId: string;
  organizationId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  uploadedChunks: Set<number>;
  tempPath: string;
  expiresAt: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ChunkInfo {
  chunkNumber: number;
  chunkSize: number;
  hash: string;
}

export interface UploadStatus {
  uploadId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  uploadedChunks: number[];
  totalChunks: number;
  percentage: number;
  status: "pending" | "uploading" | "completed" | "failed" | "expired";
  error?: string;
}

export class ChunkedUploadService {
  private sessions = new Map<string, UploadSession>();
   
  private cleanupInterval: NodeJS.Timeout | null = null;
  private tempBasePath: string;
  private wsService: WebSocketService | null = null;

  constructor(tempBasePath?: string) {
    this.tempBasePath = tempBasePath ?? process.env.TEMP_UPLOAD_PATH ?? "./storage/temp";
    this.initializeTempStorage();
    this.startCleanupJob();
  }

  /**
   * Set WebSocket service for progress broadcasting
   */
  public setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
    logger.info("WebSocket service connected to ChunkedUploadService");
  }

  /**
   * Initialize temporary storage directory
   */
  private async initializeTempStorage(): Promise<void> {
    try {
      await fs.mkdir(this.tempBasePath, { recursive: true });
      logger.info({ path: this.tempBasePath }, "Temporary upload storage initialized");
    } catch (err) {
      logger.error({ error: err, path: this.tempBasePath }, "Failed to initialize temp storage");
      throw new Error("Failed to initialize temporary upload storage");
    }
  }

  /**
   * Initialize a new chunked upload session
   */
  public async initUpload(params: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    totalChunks: number;
    chunkSize: number;
    userId: string;
    organizationId: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<{ uploadId: string; expiresAt: Date }> {
    const uploadId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

    const tempPath = path.join(this.tempBasePath, uploadId);

    // Create temp directory for this upload
    await fs.mkdir(tempPath, { recursive: true });

    const session: UploadSession = {
      id: uploadId,
      userId: params.userId,
      organizationId: params.organizationId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      totalChunks: params.totalChunks,
      chunkSize: params.chunkSize,
      uploadedChunks: new Set(),
      tempPath,
      expiresAt,
      createdAt: new Date(),
      metadata: params.metadata,
    };

    this.sessions.set(uploadId, session);

    logger.info(
      {
        uploadId,
        fileName: params.fileName,
        fileSize: params.fileSize,
        totalChunks: params.totalChunks,
        userId: params.userId,
      },
      "Chunked upload session initialized",
    );

    // Broadcast initial progress
    this.broadcastProgress(uploadId, 0, "uploading");

    return { uploadId, expiresAt };
  }

  /**
   * Upload a single chunk
   */
  public async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    chunkBuffer: Buffer,
  ): Promise<{
    success: boolean;
    receivedChunks: number[];
    remainingChunks: number[];
  }> {
    const session = this.sessions.get(uploadId);

    if (!session) {
      throw new Error("Upload session not found or expired");
    }

    // Check if session expired
    if (new Date() > session.expiresAt) {
      await this.cancelUpload(uploadId);
      throw new Error("Upload session expired");
    }

    // Validate chunk number
    if (chunkNumber < 0 || chunkNumber >= session.totalChunks) {
      throw new Error(`Invalid chunk number: ${chunkNumber}`);
    }

    // Check if chunk already uploaded
    if (session.uploadedChunks.has(chunkNumber)) {
      logger.debug({ uploadId, chunkNumber }, "Chunk already uploaded, skipping");
      return {
        success: true,
        receivedChunks: Array.from(session.uploadedChunks).sort((a, b) => a - b),
        remainingChunks: this.getRemainingChunks(session),
      };
    }

    // Save chunk to temp directory
    const chunkPath = path.join(session.tempPath, `chunk-${chunkNumber}`);
    await fs.writeFile(chunkPath, chunkBuffer);

    // Mark chunk as uploaded
    session.uploadedChunks.add(chunkNumber);

    const uploadedBytes = session.uploadedChunks.size * session.chunkSize;
    const percentage = Math.round((uploadedBytes / session.fileSize) * 100);

    logger.debug(
      {
        uploadId,
        chunkNumber,
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks,
        percentage,
      },
      "Chunk uploaded",
    );

    // Broadcast progress via WebSocket
    this.broadcastProgress(uploadId, percentage, "uploading");

    return {
      success: true,
      receivedChunks: Array.from(session.uploadedChunks).sort((a, b) => a - b),
      remainingChunks: this.getRemainingChunks(session),
    };
  }

  /**
   * Complete the upload by assembling all chunks
   */
  public async completeUpload(uploadId: string): Promise<Buffer> {
    const session = this.sessions.get(uploadId);

    if (!session) {
      throw new Error("Upload session not found");
    }

    // Verify all chunks are uploaded
    if (session.uploadedChunks.size !== session.totalChunks) {
      const missing = this.getRemainingChunks(session);
      throw new Error(`Upload incomplete. Missing chunks: ${missing.join(", ")}`);
    }

    logger.info({ uploadId, fileName: session.fileName }, "Assembling chunks");

    // Broadcast processing stage
    this.broadcastProgress(uploadId, 95, "uploading", "Assembling file...");

    // Assemble chunks in order
    const chunks: Buffer[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.tempPath, `chunk-${i}`);
      const chunkBuffer = await fs.readFile(chunkPath);
      chunks.push(chunkBuffer);
    }

    const assembledFile = Buffer.concat(chunks);

    // Verify file size
    if (assembledFile.length !== session.fileSize) {
      throw new Error(`File size mismatch. Expected ${session.fileSize}, got ${assembledFile.length}`);
    }

    logger.info(
      {
        uploadId,
        fileName: session.fileName,
        fileSize: session.fileSize,
      },
      "Chunks assembled successfully",
    );

    // Broadcast completion
    this.broadcastProgress(uploadId, 100, "completed");

    // Cleanup will happen in background
    this.scheduleCleanup(uploadId);

    return assembledFile;
  }

  /**
   * Cancel an upload and cleanup resources
   */
  public async cancelUpload(uploadId: string): Promise<void> {
    const session = this.sessions.get(uploadId);

    if (!session) {
      logger.warn({ uploadId }, "Attempted to cancel non-existent session");
      return;
    }

    logger.info({ uploadId, fileName: session.fileName }, "Cancelling upload");

    // Broadcast error
    this.broadcastProgress(uploadId, 0, "error", "Upload cancelled");

    // Cleanup
    await this.cleanupSession(uploadId);
  }

  /**
   * Get upload status
   */
  public getUploadStatus(uploadId: string): UploadStatus {
    const session = this.sessions.get(uploadId);

    if (!session) {
      return {
        uploadId,
        fileName: "",
        fileSize: 0,
        uploadedBytes: 0,
        uploadedChunks: [],
        totalChunks: 0,
        percentage: 0,
        status: "expired",
        error: "Session not found or expired",
      };
    }

    const uploadedBytes = session.uploadedChunks.size * session.chunkSize;
    const percentage = Math.round((uploadedBytes / session.fileSize) * 100);

    const status: UploadStatus["status"] =
      new Date() > session.expiresAt
        ? "expired"
        : session.uploadedChunks.size === 0
          ? "pending"
          : session.uploadedChunks.size === session.totalChunks
            ? "completed"
            : "uploading";

    return {
      uploadId,
      fileName: session.fileName,
      fileSize: session.fileSize,
      uploadedBytes,
      uploadedChunks: Array.from(session.uploadedChunks).sort((a, b) => a - b),
      totalChunks: session.totalChunks,
      percentage,
      status,
    };
  }

  /**
   * Get remaining chunks for a session
   */
  private getRemainingChunks(session: UploadSession): number[] {
    const remaining: number[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!session.uploadedChunks.has(i)) {
        remaining.push(i);
      }
    }
    return remaining;
  }

  /**
   * Broadcast progress via WebSocket
   */
  private broadcastProgress(
    uploadId: string,
    percentage: number,
    stage: "encrypting" | "uploading" | "completed" | "error",
    message?: string,
  ): void {
    if (!this.wsService) {
      logger.debug("WebSocket service not available, skipping progress broadcast");
      return;
    }

    const session = this.sessions.get(uploadId);
    if (!session) return;

    const channel = `upload:${uploadId}`;

    this.wsService.broadcast(channel, "progress", {
      fileId: uploadId,
      stage,
      percentage,
      error: stage === "error" ? message : undefined,
      fileName: session.fileName,
      fileSize: session.fileSize,
    });

    logger.debug(
      {
        uploadId,
        channel,
        stage,
        percentage,
      },
      "Progress broadcast sent",
    );
  }

  /**
   * Schedule cleanup for a completed upload
   */
  private scheduleCleanup(uploadId: string): void {
    setTimeout(
      async () => {
        await this.cleanupSession(uploadId);
      },
      5 * 60 * 1000,
    ); // Cleanup after 5 minutes
  }

  /**
   * Cleanup a single session
   */
  private async cleanupSession(uploadId: string): Promise<void> {
    const session = this.sessions.get(uploadId);

    if (!session) return;

    try {
      // Remove temp directory and all chunks
      await fs.rm(session.tempPath, { recursive: true, force: true });
      this.sessions.delete(uploadId);

      logger.info({ uploadId, fileName: session.fileName }, "Upload session cleaned up");
    } catch (err) {
      logger.error({ error: err, uploadId }, "Failed to cleanup session");
    }
  }

  /**
   * Start periodic cleanup job for expired sessions
   */
  private startCleanupJob(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredSessions();
      },
      60 * 60 * 1000,
    );

    logger.info("Cleanup job started for expired upload sessions");
  }

  /**
   * Cleanup expired sessions
   */
  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [uploadId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(uploadId);
      }
    }

    if (expiredSessions.length > 0) {
      logger.info({ count: expiredSessions.length }, "Cleaning up expired sessions");

      for (const uploadId of expiredSessions) {
        await this.cleanupSession(uploadId);
      }
    }
  }

  /**
   * Shutdown service and cleanup resources
   */
  public async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    logger.info("ChunkedUploadService shutting down");
  }
}
