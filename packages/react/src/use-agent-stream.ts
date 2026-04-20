"use client";

import { useCallback, useRef, useState } from "react";
import { applyEvent, finalizeBlocks } from "./reducer.js";
import type {
  AssistantMessage,
  ContentBlock,
  ConversationMessage,
  StreamEvent,
  StreamStatus,
  Transport,
  TurnSummary,
  UserMessage,
} from "./types.js";

export interface UseAgentStreamOptions {
  transport: Transport;
  /**
   * Called for every event as it arrives. Use for side effects (logging,
   * persistence) without forking your own reducer. Runs before state updates.
   */
  onEvent?: (event: StreamEvent) => void;
  /** Called when the turn completes cleanly (after `done` event). */
  onTurnComplete?: (message: AssistantMessage) => void;
  /** Called on any error (network, server, or `error` event). */
  onError?: (error: Error) => void;
  /** Generate message IDs. Defaults to `crypto.randomUUID()`. */
  generateId?: () => string;
  /** Pre-seed message history (e.g. loaded from a DB). */
  initialMessages?: ConversationMessage[];
}

export interface UseAgentStreamResult {
  /** Full conversation (user + assistant turns, in order). */
  messages: ConversationMessage[];
  /** Content blocks for the currently streaming assistant turn. */
  currentBlocks: ContentBlock[];
  status: StreamStatus;
  error: string | null;
  /** Summary (messageId, usage, cost) from the most recently finished turn. */
  lastSummary: TurnSummary | null;
  /** Send a user message and stream the assistant's reply. */
  sendMessage: (
    text: string,
    opts?: { conversationId?: string }
  ) => Promise<void>;
  /** Abort the in-flight turn. Safe to call when idle. */
  stop: () => void;
  /** Clear messages, blocks, and error state. Aborts any in-flight turn. */
  reset: () => void;
  /** Imperatively replace the message history (e.g. when loading a conversation). */
  setMessages: (messages: ConversationMessage[]) => void;
}

/**
 * Core streaming hook. Transport-agnostic: pass an SSE transport, an iterator
 * transport, or any custom `Transport`. State shape matches mini-infra's
 * `ChatMessage` union and family-helper's `ContentBlock` list so migration
 * from either app is mechanical.
 */
export function useAgentStream(
  options: UseAgentStreamOptions
): UseAgentStreamResult {
  const {
    transport,
    onEvent,
    onTurnComplete,
    onError,
    generateId = defaultGenerateId,
    initialMessages = [],
  } = options;

  const [messages, setMessagesState] =
    useState<ConversationMessage[]>(initialMessages);
  const [currentBlocks, setCurrentBlocks] = useState<ContentBlock[]>([]);
  const [status, setStatus] = useState<StreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<TurnSummary | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessagesState([]);
    setCurrentBlocks([]);
    setStatus("idle");
    setError(null);
    setLastSummary(null);
  }, [stop]);

  const setMessages = useCallback((next: ConversationMessage[]) => {
    setMessagesState(next);
  }, []);

  const sendMessage = useCallback(
    async (text: string, opts?: { conversationId?: string }) => {
      // Snapshot blocks for this turn so concurrent setStates don't race.
      let blocks: ContentBlock[] = [];
      let summary: TurnSummary | null = null;
      let turnError: string | null = null;

      const userMsg: UserMessage = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      setMessagesState((prev) => [...prev, userMsg]);
      setCurrentBlocks([]);
      setStatus("connecting");
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;
      let sawFirstEvent = false;

      try {
        const iter = transport.send({
          text,
          conversationId: opts?.conversationId,
          signal: controller.signal,
        });

        for await (const event of iter) {
          if (controller.signal.aborted) break;
          onEvent?.(event);

          if (!sawFirstEvent) {
            sawFirstEvent = true;
            setStatus("streaming");
          }

          if (event.type === "done") {
            summary = {
              messageId: event.messageId,
              usage: event.usage,
              durationMs: event.durationMs,
              cost: event.cost,
              turns: event.turns,
            };
            continue;
          }
          if (event.type === "error") {
            turnError = event.error;
            continue;
          }

          blocks = applyEvent(blocks, event);
          // Flush to state. Cloning keeps React's identity check happy.
          setCurrentBlocks(blocks);
        }

        blocks = finalizeBlocks(blocks);
        setCurrentBlocks(blocks);

        if (turnError) {
          setError(turnError);
          setStatus("error");
          onError?.(new Error(turnError));
          return;
        }

        const assistantMsg: AssistantMessage = {
          id: summary?.messageId ?? generateId(),
          role: "assistant",
          blocks,
          summary: summary ?? undefined,
          timestamp: Date.now(),
        };
        setMessagesState((prev) => [...prev, assistantMsg]);
        setCurrentBlocks([]);
        setLastSummary(summary);
        setStatus("done");
        onTurnComplete?.(assistantMsg);
      } catch (err) {
        if (
          err instanceof DOMException && err.name === "AbortError"
        ) {
          setStatus("idle");
          setCurrentBlocks([]);
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("error");
        onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        abortRef.current = null;
      }
    },
    [transport, generateId, onEvent, onTurnComplete, onError]
  );

  return {
    messages,
    currentBlocks,
    status,
    error,
    lastSummary,
    sendMessage,
    stop,
    reset,
    setMessages,
  };
}

function defaultGenerateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}
