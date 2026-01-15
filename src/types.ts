/**
 * Core types for the standalone AI SDK.
 * PI-compatible base types for drop-in replacement.
 */

/**
 * Content types for messages.
 */
export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image";
  url?: string;
  base64?: string;
  mimeType?: string;
};

export type Content = TextContent | ImageContent;

/**
 * Message roles.
 */
export type Role = "user" | "assistant" | "system" | "tool";

/**
 * Base message type.
 */
export type BaseMessage = {
  role: Role;
  content: Content[] | string;
};

/**
 * User message.
 */
export type UserMessage = BaseMessage & {
  role: "user";
};

/**
 * Assistant message with optional tool calls.
 */
export type AssistantMessage = BaseMessage & {
  role: "assistant";
  toolCalls?: ToolCallResult[];
};

/**
 * Tool result message.
 */
export type ToolResultMessage = {
  role: "tool";
  toolCallId: string;
  content: string;
};

/**
 * Union of all message types.
 */
export type Message = UserMessage | AssistantMessage | ToolResultMessage;

/**
 * Tool call result from assistant.
 */
export type ToolCallResult = {
  id: string;
  name: string;
  arguments: string;
};

/**
 * Tool definition for the agent.
 */
export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

/**
 * Usage information from API calls.
 */
export type Usage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
};

/**
 * Stop reason from API.
 */
export type StopReason = "end_turn" | "tool_use" | "max_tokens" | "stop_sequence";

/**
 * API backend types.
 */
export type Api = "anthropic" | "openai" | "openai-responses" | "google" | "custom";

/**
 * Known provider names.
 */
export type KnownProvider = "anthropic" | "openai" | "google" | "openrouter" | "custom";

/**
 * Model configuration.
 */
export type Model = {
  id: string;
  name: string;
  provider: KnownProvider;
  api: Api;
  contextWindow: number;
  maxTokens: number;
  supportsVision?: boolean;
  supportsToolUse?: boolean;
  supportsStreaming?: boolean;
  cost?: {
    input: number;
    output: number;
    cacheRead?: number;
    cacheWrite?: number;
  };
};

/**
 * Provider configuration.
 */
export type Provider = {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  models: Model[];
};
