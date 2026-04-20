/**
 * Token usage reported by the Anthropic API. Mirrors the shape used by
 * `@anthropic-ai/sdk` but duplicated here so consumers don't need the SDK
 * installed to use this package.
 */
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

export type BlockStatus = "streaming" | "executing" | "complete";

/**
 * Normalized stream events. Matches the SSE event shapes already produced by
 * family-helper (`lib/agent/types.ts`) and mini-infra (`agent-sidecar`). Apps
 * on older shapes can map into this union in their transport layer.
 */
export type StreamEvent =
  // Text streaming
  | { type: "text_start"; index: number }
  | { type: "text_delta"; index: number; text: string }
  | { type: "text_done"; index: number }

  // Extended thinking
  | { type: "thinking_start"; index: number; redacted?: boolean }
  | { type: "thinking_delta"; index: number; thinking: string }
  | { type: "thinking_done"; index: number; signature?: string }

  // Tool use
  | { type: "tool_use_start"; index: number; id: string; name: string }
  | { type: "tool_use_input"; index: number; partialJson: string }
  | { type: "tool_use_done"; index: number; input: Record<string, unknown> }
  | {
      type: "tool_result";
      id: string;
      name?: string;
      output: string;
      isError?: boolean;
    }

  // Completion / errors
  | {
      type: "done";
      messageId?: string;
      usage?: Usage;
      durationMs?: number;
      cost?: number;
      turns?: number;
    }
  | { type: "error"; error: string };

export interface TextContentBlock {
  type: "text";
  index: number;
  text: string;
  status: BlockStatus;
}

export interface ThinkingContentBlock {
  type: "thinking";
  index: number;
  thinking: string;
  redacted?: boolean;
  signature?: string;
  status: BlockStatus;
}

export interface ToolUseContentBlock {
  type: "tool_use";
  index: number;
  id: string;
  name: string;
  input?: Record<string, unknown>;
  /** Raw partial JSON accumulated during `tool_use_input` events. */
  partialJson?: string;
  result?: { output: string; isError?: boolean };
  status: BlockStatus;
}

export type ContentBlock =
  | TextContentBlock
  | ThinkingContentBlock
  | ToolUseContentBlock;

/** A finished turn's summary (used for message history). */
export interface TurnSummary {
  messageId?: string;
  usage?: Usage;
  durationMs?: number;
  cost?: number;
  turns?: number;
}

export type StreamStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "done"
  | "error";

export interface UserMessage {
  id: string;
  role: "user";
  content: string;
  timestamp: number;
}

export interface AssistantMessage {
  id: string;
  role: "assistant";
  /** Completed content blocks from this turn. */
  blocks: ContentBlock[];
  summary?: TurnSummary;
  timestamp: number;
}

export type ConversationMessage = UserMessage | AssistantMessage;

export interface TransportInput {
  text: string;
  conversationId?: string;
  signal?: AbortSignal;
}

export interface Transport {
  send(input: TransportInput): AsyncIterable<StreamEvent>;
}
