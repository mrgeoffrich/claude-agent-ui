// Types
export type {
  BlockStatus,
  StreamEvent,
  TextContentBlock,
  ThinkingContentBlock,
  ToolUseContentBlock,
  ContentBlock,
  TurnSummary,
  StreamStatus,
  UserMessage,
  AssistantMessage,
  ConversationMessage,
  Transport,
  TransportInput,
  Usage,
} from "./types.js";

// Reducer
export { applyEvent, reduceEvents, finalizeBlocks } from "./reducer.js";

// Transports
export { sseTransport } from "./transports/sse.js";
export type { SseTransportOptions } from "./transports/sse.js";
export { iteratorTransport } from "./transports/iterator.js";

// React hook
export { useAgentStream } from "./use-agent-stream.js";
export type {
  UseAgentStreamOptions,
  UseAgentStreamResult,
} from "./use-agent-stream.js";

// Registry
export { resolveToolRenderer } from "./registry.js";
export type {
  RendererRegistry,
  ToolRenderer,
  ToolRendererProps,
} from "./registry.js";

// Components
export * from "./components/index.js";
