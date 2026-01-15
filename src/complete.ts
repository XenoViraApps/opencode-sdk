/**
 * Completion functions for the standalone AI SDK.
 * Wraps OpenCode's prompt API with a simpler interface.
 */

import { createOpencode, type OpencodeClient } from "@opencode-ai/sdk";
import type { Message, Usage, ToolDefinition, StopReason } from "./types.js";

/**
 * Completion options.
 */
export type CompleteOptions = {
  /** Provider/model in format "provider/model" */
  model?: string;
  /** Working directory */
  workspaceDir: string;
  /** Messages to send */
  messages?: Message[];
  /** Single prompt (alternative to messages) */
  prompt?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Available tools */
  tools?: ToolDefinition[];
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Provider configuration overrides */
  providerConfig?: Record<string, unknown>;
  /** Abort signal */
  abortSignal?: AbortSignal;
};

/**
 * Completion result.
 */
export type CompleteResult = {
  /** Generated text content */
  text: string;
  /** Tool calls if any */
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  /** Stop reason */
  stopReason: StopReason;
  /** Token usage */
  usage: Usage;
  /** Raw response data */
  raw?: unknown;
};

/**
 * Stream event types.
 */
export type StreamEvent =
  | { type: "text"; text: string }
  | { type: "tool_call_start"; id: string; name: string }
  | { type: "tool_call_delta"; id: string; delta: string }
  | { type: "tool_call_end"; id: string; name: string; arguments: string }
  | { type: "done"; result: CompleteResult };

/**
 * Run a completion request.
 * This is the main API for single-turn completions.
 */
export async function complete(options: CompleteOptions): Promise<CompleteResult> {
  const abortController = new AbortController();

  // Link external abort signal
  if (options.abortSignal) {
    if (options.abortSignal.aborted) {
      throw new Error("Aborted");
    }
    options.abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
  }

  // Build OpenCode config
  const opencodeConfig: Record<string, unknown> = {};
  if (options.model) {
    opencodeConfig.model = options.model;
  }
  if (options.providerConfig) {
    opencodeConfig.provider = options.providerConfig;
  }

  let client: OpencodeClient | undefined;
  let serverClose: (() => void) | undefined;

  try {
    // Create OpenCode server and client
    const opencode = await createOpencode({
      signal: abortController.signal,
      timeout: options.timeout ?? 120_000,
      config: opencodeConfig,
    });

    client = opencode.client;
    serverClose = opencode.server.close;

    // Create session
    const session = await client.session.create({
      query: { directory: options.workspaceDir },
    });

    if (!session.data) {
      throw new Error("Failed to create session");
    }

    const sessionId = session.data.id;

    // Build prompt parts
    const parts: Array<{ type: "text"; text: string }> = [];

    if (options.prompt) {
      parts.push({ type: "text", text: options.prompt });
    } else if (options.messages) {
      // Convert messages to text for now
      // TODO: Proper message handling
      const text = options.messages
        .filter((m): m is Message & { role: "user" } => m.role === "user")
        .map((m) => (typeof m.content === "string" ? m.content : ""))
        .join("\n");
      if (text) {
        parts.push({ type: "text", text });
      }
    }

    if (options.systemPrompt) {
      parts.push({ type: "text", text: `[System]: ${options.systemPrompt}` });
    }

    // Subscribe to events
    const eventStreamResult = await client.event.subscribe();
    const eventStream = eventStreamResult.stream;

    // Start prompt
    const promptPromise = client.session.prompt({
      path: { id: sessionId },
      body: { parts },
    });

    // Collect response
    let responseText = "";
    const toolCalls: CompleteResult["toolCalls"] = [];
    let usage: Usage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };
    let stopReason: StopReason = "end_turn";

    // Process events
    try {
      for await (const event of eventStream) {
        if (abortController.signal.aborted) break;
        if (!event) continue;

        // Extract session ID from event
        const eventSessionId = extractSessionId(event);
        if (eventSessionId && eventSessionId !== sessionId) continue;

        if (event.type === "message.part.updated") {
          const part = (event.properties as Record<string, unknown>).part as Record<string, unknown> | undefined;
          if (part?.type === "text") {
            responseText = (part.text as string) ?? "";
          }
        } else if (event.type === "message.updated") {
          const info = (event.properties as Record<string, unknown>).info as Record<string, unknown> | undefined;
          if (info?.role === "assistant" && info.tokens) {
            const tokens = info.tokens as Record<string, unknown>;
            usage = {
              inputTokens: (tokens.input as number) ?? 0,
              outputTokens: (tokens.output as number) ?? 0,
              totalTokens: ((tokens.input as number) ?? 0) + ((tokens.output as number) ?? 0),
            };
          }
        } else if (event.type === "session.idle" || event.type === "session.status") {
          const status = (event.properties as Record<string, unknown>).status as Record<string, unknown> | undefined;
          if (!status || status.type === "idle") {
            break;
          }
        }
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        throw err;
      }
    }

    // Wait for prompt to complete
    try {
      await promptPromise;
    } catch {
      // Ignore if aborted
      if (!abortController.signal.aborted) {
        throw new Error("Prompt failed");
      }
    }

    return {
      text: responseText,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason,
      usage,
    };
  } finally {
    try {
      serverClose?.();
    } catch {
      // Ignore close errors
    }
  }
}

/**
 * Run a streaming completion request.
 * Returns an async generator of stream events.
 */
export async function* streamComplete(options: CompleteOptions): AsyncGenerator<StreamEvent> {
  // For now, just run complete and yield the result
  // TODO: Implement proper streaming
  const result = await complete(options);

  if (result.text) {
    yield { type: "text", text: result.text };
  }

  for (const tc of result.toolCalls ?? []) {
    yield { type: "tool_call_start", id: tc.id, name: tc.name };
    yield { type: "tool_call_delta", id: tc.id, delta: tc.arguments };
    yield { type: "tool_call_end", id: tc.id, name: tc.name, arguments: tc.arguments };
  }

  yield { type: "done", result };
}

/**
 * Simple completion helper - just text in, text out.
 */
export async function simpleComplete(
  prompt: string,
  options: Omit<CompleteOptions, "prompt" | "messages">
): Promise<string> {
  const result = await complete({ ...options, prompt });
  return result.text;
}

/**
 * Extract session ID from an event.
 */
function extractSessionId(event: { type: string; properties?: unknown }): string | undefined {
  const props = event.properties as Record<string, unknown> | undefined;
  if (!props) return undefined;

  if (typeof props.sessionID === "string") {
    return props.sessionID;
  }

  if (props.info && typeof props.info === "object") {
    const info = props.info as Record<string, unknown>;
    if (typeof info.sessionID === "string") {
      return info.sessionID;
    }
  }

  return undefined;
}
