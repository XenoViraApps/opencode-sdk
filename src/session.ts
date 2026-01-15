/**
 * Session management for the standalone AI SDK.
 * Wraps OpenCode's session API with a simpler interface.
 */

import { createOpencode, type OpencodeClient } from "@opencode-ai/sdk";
import type { Message, Usage } from "./types.js";

/**
 * Session configuration options.
 */
export type SessionConfig = {
  /** Working directory for the session */
  workspaceDir: string;
  /** Optional session ID (auto-generated if not provided) */
  sessionId?: string;
  /** Provider/model in format "provider/model" */
  model?: string;
  /** Provider configuration overrides */
  providerConfig?: Record<string, unknown>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Port range start for OpenCode server */
  portStart?: number;
  /** Port range end for OpenCode server */
  portEnd?: number;
};

/**
 * Session state.
 */
export type SessionState = {
  id: string;
  messages: Message[];
  usage: Usage;
  isActive: boolean;
};

/**
 * Session manager for creating and managing AI sessions.
 */
export class SessionManager {
  private client: OpencodeClient | null = null;
  private serverClose: (() => void) | null = null;
  private sessionId: string | null = null;
  private config: SessionConfig;

  constructor(config: SessionConfig) {
    this.config = config;
  }

  /**
   * Initialize the session manager and create a session.
   */
  async init(): Promise<string> {
    if (this.client) {
      throw new Error("SessionManager already initialized");
    }

    // Build OpenCode config
    const opencodeConfig: Record<string, unknown> = {};
    if (this.config.model) {
      opencodeConfig.model = this.config.model;
    }
    if (this.config.providerConfig) {
      opencodeConfig.provider = this.config.providerConfig;
    }

    // Create OpenCode server and client
    const opencode = await createOpencode({
      timeout: this.config.timeout ?? 120_000,
      port: this.config.portStart ?? 4100,
      config: opencodeConfig,
    });

    this.client = opencode.client;
    this.serverClose = opencode.server.close;

    // Create session
    const session = await this.client.session.create({
      query: { directory: this.config.workspaceDir },
    });

    if (!session.data) {
      throw new Error("Failed to create session");
    }

    this.sessionId = session.data.id;
    return this.sessionId;
  }

  /**
   * Get the current session ID.
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get the OpenCode client instance.
   */
  getClient(): OpencodeClient | null {
    return this.client;
  }

  /**
   * Close the session and cleanup resources.
   */
  async close(): Promise<void> {
    try {
      this.serverClose?.();
    } catch {
      // Ignore close errors
    }
    this.client = null;
    this.serverClose = null;
    this.sessionId = null;
  }
}

/**
 * Create a new session manager.
 */
export function createSessionManager(config: SessionConfig): SessionManager {
  return new SessionManager(config);
}
