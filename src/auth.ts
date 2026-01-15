/**
 * Authentication and credential management for the standalone AI SDK.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

/**
 * Auth storage interface.
 */
export type AuthStorage = {
  /** Get a credential by key */
  get(key: string): Promise<string | undefined>;
  /** Set a credential */
  set(key: string, value: string): Promise<void>;
  /** Delete a credential */
  delete(key: string): Promise<void>;
  /** List all credential keys */
  list(): Promise<string[]>;
};

/**
 * OAuth credentials.
 */
export type OAuthCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
};

/**
 * OAuth provider configuration.
 */
export type OAuthProvider = {
  name: string;
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
};

/**
 * Known credential locations.
 */
const CREDENTIAL_PATHS = [
  join(homedir(), ".viragate", "credentials"),
  join(homedir(), ".config", "viragate", "credentials"),
  join(homedir(), ".config", "opencode", "credentials"),
];

/**
 * Discover available auth storage.
 * Looks for credentials in known locations.
 */
export async function discoverAuthStorage(): Promise<AuthStorage | null> {
  for (const basePath of CREDENTIAL_PATHS) {
    try {
      const stats = await stat(basePath);
      if (stats.isDirectory()) {
        return createFileAuthStorage(basePath);
      }
    } catch {
      // Path doesn't exist
    }
  }

  return null;
}

/**
 * Create a file-based auth storage.
 */
export function createFileAuthStorage(basePath: string): AuthStorage {
  return {
    async get(key: string): Promise<string | undefined> {
      try {
        const content = await readFile(join(basePath, key), "utf-8");
        return content.trim();
      } catch {
        return undefined;
      }
    },

    async set(_key: string, _value: string): Promise<void> {
      // Write operations not implemented for safety
      throw new Error("Write operations not supported in read-only auth storage");
    },

    async delete(_key: string): Promise<void> {
      // Delete operations not implemented for safety
      throw new Error("Delete operations not supported in read-only auth storage");
    },

    async list(): Promise<string[]> {
      try {
        const entries = await readdir(basePath);
        const keys: string[] = [];
        for (const entry of entries) {
          const stats = await stat(join(basePath, entry));
          if (stats.isFile()) {
            keys.push(entry);
          }
        }
        return keys;
      } catch {
        return [];
      }
    },
  };
}

/**
 * Create an in-memory auth storage (for testing).
 */
export function createMemoryAuthStorage(): AuthStorage {
  const store = new Map<string, string>();

  return {
    async get(key: string): Promise<string | undefined> {
      return store.get(key);
    },

    async set(key: string, value: string): Promise<void> {
      store.set(key, value);
    },

    async delete(key: string): Promise<void> {
      store.delete(key);
    },

    async list(): Promise<string[]> {
      return Array.from(store.keys());
    },
  };
}

/**
 * Get an API key from auth storage by provider name.
 */
export async function getApiKey(
  storage: AuthStorage,
  provider: string
): Promise<string | undefined> {
  // Try common key naming patterns
  const patterns = [
    `${provider}_api_key`,
    `${provider.toUpperCase()}_API_KEY`,
    `${provider}-api-key`,
    provider,
  ];

  for (const pattern of patterns) {
    const value = await storage.get(pattern);
    if (value) return value;
  }

  return undefined;
}
