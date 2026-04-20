import type {
  StreamEvent,
  Transport,
  TransportInput,
} from "../types.js";

/**
 * Wrap an arbitrary async iterable (or generator function) as a Transport.
 * Useful for:
 *   - Tests (yield a canned sequence of events).
 *   - Calling `query()` from `@anthropic-ai/claude-agent-sdk` directly in a
 *     Node/edge handler without HTTP (e.g. RSC, tRPC).
 *   - Anything that isn't SSE (WebSocket, Socket.IO, postMessage).
 */
export function iteratorTransport(
  fn: (input: TransportInput) => AsyncIterable<StreamEvent>
): Transport {
  return {
    async *send(input: TransportInput): AsyncIterable<StreamEvent> {
      yield* fn(input);
    },
  };
}
