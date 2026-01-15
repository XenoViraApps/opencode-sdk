/**
 * @viragate/ai-sdk - Standalone AI SDK for ViraGate
 *
 * OpenCode-based replacement for PI SDK with a simpler, more composable API.
 *
 * Main exports:
 * - complete(), streamComplete(), simpleComplete() - Completion functions
 * - SessionManager, createSessionManager() - Session management
 * - loadSkillsFromDir(), formatSkillsForPrompt() - Skills handling
 * - discoverAuthStorage(), getApiKey() - Authentication
 * - createModelRegistry(), discoverModels() - Model management
 */

// Core types
export type {
  TextContent,
  ImageContent,
  Content,
  Role,
  BaseMessage,
  UserMessage,
  AssistantMessage,
  ToolResultMessage,
  Message,
  ToolCallResult,
  ToolDefinition,
  Usage,
  StopReason,
  Api,
  KnownProvider,
  Model,
  Provider,
} from "./types.js";

// Completion functions
export {
  complete,
  streamComplete,
  simpleComplete,
} from "./complete.js";
export type {
  CompleteOptions,
  CompleteResult,
  StreamEvent,
} from "./complete.js";

// Session management
export {
  SessionManager,
  createSessionManager,
} from "./session.js";
export type {
  SessionConfig,
  SessionState,
} from "./session.js";

// Skills
export {
  loadSkillsFromDir,
  formatSkillsForPrompt,
  createSkillSnapshot,
} from "./skills.js";
export type {
  Skill,
  SkillSnapshot,
} from "./skills.js";

// Authentication
export {
  discoverAuthStorage,
  createFileAuthStorage,
  createMemoryAuthStorage,
  getApiKey,
} from "./auth.js";
export type {
  AuthStorage,
  OAuthCredentials,
  OAuthProvider,
} from "./auth.js";

// Models
export {
  createModelRegistry,
  discoverModels,
  getDefaultModel,
  parseModelPath,
  formatModelPath,
} from "./models.js";
export type {
  ModelEntry,
  ModelRegistry,
} from "./models.js";

// OpenCode SDK primitives (for advanced use cases)
export { createOpencode, type OpencodeClient } from "./opencode.js";
export type {
  Event,
  EventMessagePartUpdated,
  EventMessageUpdated,
  EventSessionIdle,
  EventSessionStatus,
  Part,
  TextPart,
  ToolPart,
  ReasoningPart,
  FilePart,
} from "./opencode.js";
