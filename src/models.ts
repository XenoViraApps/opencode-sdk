/**
 * Model discovery and registry for the standalone AI SDK.
 */

import type { Model, KnownProvider } from "./types.js";

/**
 * Model entry in the registry.
 */
export type ModelEntry = {
  id: string;
  provider: KnownProvider;
  model: Model;
};

/**
 * Model registry for looking up models.
 */
export type ModelRegistry = {
  /** Get a model by ID */
  get(id: string): Model | undefined;
  /** Get a model by provider/model format */
  getByPath(path: string): Model | undefined;
  /** List all models */
  list(): Model[];
  /** List models by provider */
  listByProvider(provider: KnownProvider): Model[];
  /** Add a model to the registry */
  add(model: Model): void;
};

/**
 * Default models for common providers.
 */
const DEFAULT_MODELS: Model[] = [
  // Anthropic
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    api: "anthropic",
    contextWindow: 200_000,
    maxTokens: 8192,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "anthropic",
    api: "anthropic",
    contextWindow: 200_000,
    maxTokens: 4096,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
  },
  // OpenAI
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "openai",
    api: "openai",
    contextWindow: 128_000,
    maxTokens: 4096,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    api: "openai-responses",
    contextWindow: 128_000,
    maxTokens: 16384,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
  },
  // Google
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "google",
    api: "google",
    contextWindow: 2_000_000,
    maxTokens: 8192,
    supportsVision: true,
    supportsToolUse: true,
    supportsStreaming: true,
  },
];

/**
 * Create a model registry.
 */
export function createModelRegistry(initialModels?: Model[]): ModelRegistry {
  const models = new Map<string, Model>();

  // Add default models
  for (const model of DEFAULT_MODELS) {
    models.set(model.id, model);
  }

  // Add initial models (override defaults)
  if (initialModels) {
    for (const model of initialModels) {
      models.set(model.id, model);
    }
  }

  return {
    get(id: string): Model | undefined {
      return models.get(id);
    },

    getByPath(path: string): Model | undefined {
      // Parse "provider/model" format
      const parts = path.split("/");
      if (parts.length === 2) {
        const [provider, modelId] = parts;
        const model = models.get(modelId);
        if (model && model.provider === provider) {
          return model;
        }
        // Try finding by provider match
        for (const m of models.values()) {
          if (m.provider === provider && m.id === modelId) {
            return m;
          }
        }
      }
      // Fallback to direct ID lookup
      return models.get(path);
    },

    list(): Model[] {
      return Array.from(models.values());
    },

    listByProvider(provider: KnownProvider): Model[] {
      return Array.from(models.values()).filter((m) => m.provider === provider);
    },

    add(model: Model): void {
      models.set(model.id, model);
    },
  };
}

/**
 * Discover models from configuration or environment.
 */
export async function discoverModels(): Promise<Model[]> {
  // For now, just return defaults
  // TODO: Load from config files, environment, etc.
  return [...DEFAULT_MODELS];
}

/**
 * Get the default model for a provider.
 */
export function getDefaultModel(provider: KnownProvider): Model | undefined {
  return DEFAULT_MODELS.find((m) => m.provider === provider);
}

/**
 * Parse a model path into provider and model ID.
 */
export function parseModelPath(path: string): { provider: string; modelId: string } | undefined {
  const parts = path.split("/");
  if (parts.length !== 2) return undefined;
  return { provider: parts[0], modelId: parts[1] };
}

/**
 * Format a model path from provider and model ID.
 */
export function formatModelPath(provider: string, modelId: string): string {
  return `${provider}/${modelId}`;
}
