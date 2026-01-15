# @viragate/ai-sdk

Standalone AI SDK for [ViraGate](https://github.com/XenoViraApps/viragate) built on [OpenCode](https://github.com/opencode-ai/opencode).

## What is this?

This is a lightweight TypeScript SDK that wraps OpenCode's AI capabilities for use in ViraGate. It provides a clean, minimal API for:

- **Session management** - Create and manage AI conversation sessions
- **Model authentication** - Handle OAuth and API key auth for multiple providers (Anthropic, OpenAI, Google, etc.)
- **Completions** - Stream AI responses with tool calling support
- **Skills** - Execute ViraGate skills during AI sessions
- **Model discovery** - Scan and detect local/remote AI models via [modelscan](https://github.com/opencode-ai/modelscan)

## Why does ViraGate use this?

ViraGate is a **model-agnostic AI gateway** that runs across multiple devices (macOS, Linux, Windows, iOS, Android). It needs to:

1. **Support any AI model** - OpenCode provides universal model compatibility
2. **Stream responses** - Real-time streaming to messaging channels (WhatsApp, Telegram, Slack, etc.)
3. **Tool calling** - Execute tools like camera capture, location sharing, canvas rendering
4. **Multi-provider auth** - Handle OAuth flows for Anthropic/OpenAI/Google
5. **Local + remote models** - Support both cloud APIs and local models (via modelscan)

This SDK provides the core AI primitives ViraGate needs without pulling in heavy framework dependencies.

## Architecture

```
ViraGate Gateway
    ↓
@viragate/ai-sdk (this package)
    ↓
OpenCode (@opencode-ai/sdk)
    ↓
Model Providers (Anthropic, OpenAI, Google, Local, etc.)
```

## Features

### Session Management
Create isolated AI conversation sessions with tool support:

```typescript
import { createSession } from '@viragate/ai-sdk/session';

const session = await createSession({
  provider: 'anthropic',
  model: 'claude-opus-4.5',
  tools: [...], // ViraGate agent tools
});
```

### Streaming Completions
Stream AI responses in real-time:

```typescript
import { complete } from '@viragate/ai-sdk/complete';

for await (const chunk of complete({
  session,
  messages: [...],
  stream: true,
})) {
  console.log(chunk.content); // Stream to WhatsApp, Slack, etc.
}
```

### Model Authentication
Handle OAuth and API key auth for multiple providers:

```typescript
import { getAuthenticatedModel } from '@viragate/ai-sdk/auth';

const model = await getAuthenticatedModel({
  provider: 'anthropic',
  authType: 'oauth', // or 'api_key'
  credentialsPath: '~/.viragate/credentials',
});
```

### Skills Integration
Execute ViraGate skills during conversations:

```typescript
import { executeSkill } from '@viragate/ai-sdk/skills';

const result = await executeSkill({
  skillName: 'commit',
  args: '-m "feat: add new feature"',
  session,
});
```

### Model Discovery (via modelscan)
Detect available models (local + remote):

```typescript
import { scanModels } from '@viragate/ai-sdk/models';

const models = await scanModels({
  includeLocal: true,   // Scan for Ollama, LM Studio, etc.
  includeRemote: true,  // Check API credentials
});
```

## Installation

This package is designed to be linked as a local dependency in ViraGate:

```json
{
  "dependencies": {
    "@viragate/ai-sdk": "link:../opencode-sdk"
  }
}
```

For standalone use:

```bash
pnpm install @viragate/ai-sdk
```

## Exports

- `@viragate/ai-sdk` - Main exports (session, complete, auth, models)
- `@viragate/ai-sdk/session` - Session management
- `@viragate/ai-sdk/complete` - Streaming completions
- `@viragate/ai-sdk/auth` - Authentication helpers
- `@viragate/ai-sdk/models` - Model discovery
- `@viragate/ai-sdk/skills` - Skill execution
- `@viragate/ai-sdk/opencode` - Direct OpenCode re-exports

## Requirements

- Node.js ≥ 22
- TypeScript ≥ 5.4

## License

MIT

## Related Projects

- [ViraGate](https://github.com/XenoViraApps/viragate) - Multi-device AI gateway
- [OpenCode](https://github.com/opencode-ai/opencode) - Universal AI framework
- [modelscan](https://github.com/opencode-ai/modelscan) - AI model discovery
