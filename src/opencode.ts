/**
 * Re-export OpenCode SDK primitives used by opencode-runner.
 *
 * This module provides access to the raw OpenCode SDK for cases where
 * the high-level API (complete(), streamComplete()) isn't sufficient.
 */

// Core client creator
export { createOpencode, type OpencodeClient } from "@opencode-ai/sdk";

// Event types
export type {
  Event,
  EventMessagePartUpdated,
  EventMessageUpdated,
  EventSessionIdle,
  EventSessionStatus,
} from "@opencode-ai/sdk";

// Part types
export type {
  Part,
  TextPart,
  ToolPart,
  ReasoningPart,
  FilePart,
} from "@opencode-ai/sdk";
