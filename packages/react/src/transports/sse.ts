import type {
  StreamEvent,
  Transport,
  TransportInput,
} from "../types.js";

export interface SseTransportOptions {
  /**
   * URL to POST to, or a function that derives the URL from the turn input.
   * Family-helper's pattern is `/api/conversations/${conversationId}/messages`.
   */
  url: string | ((input: TransportInput) => string);
  /** Extra headers (e.g. API keys). Called per request. */
  headers?:
    | Record<string, string>
    | ((input: TransportInput) => Record<string, string>);
  /**
   * Build the request body. Defaults to `{ content: input.text }` which
   * matches family-helper. Override for different API shapes.
   */
  body?: (input: TransportInput) => unknown;
  /** HTTP method. Defaults to POST. */
  method?: string;
  /**
   * Optional transform for incoming JSON before it's typed as `StreamEvent`.
   * Use this when your backend emits a slightly different event shape.
   */
  mapEvent?: (raw: unknown) => StreamEvent | null;
}

/**
 * POST → SSE transport. Reads `data: {json}\n\n` frames from the response
 * body and yields them as `StreamEvent`s. Compatible with family-helper's
 * `/api/conversations/[id]/messages` endpoint out of the box.
 */
export function sseTransport(opts: SseTransportOptions): Transport {
  return {
    async *send(input: TransportInput): AsyncIterable<StreamEvent> {
      const url =
        typeof opts.url === "function" ? opts.url(input) : opts.url;
      const headers = {
        "Content-Type": "application/json",
        ...(typeof opts.headers === "function"
          ? opts.headers(input)
          : opts.headers ?? {}),
      };
      const body = opts.body
        ? opts.body(input)
        : { content: input.text, conversationId: input.conversationId };

      const response = await fetch(url, {
        method: opts.method ?? "POST",
        headers,
        body: JSON.stringify(body),
        signal: input.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        throw new Error(
          `SSE transport: HTTP ${response.status}${err ? `: ${err}` : ""}`
        );
      }
      if (!response.body) throw new Error("SSE transport: no response body");

      yield* parseSseStream(response.body, opts.mapEvent);
    },
  };
}

async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  mapEvent?: (raw: unknown) => StreamEvent | null
): AsyncIterable<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames end with a blank line. Process complete frames only; keep
      // the trailing partial frame in `buffer` for the next chunk.
      let sepIdx: number;
      while ((sepIdx = indexOfFrameSeparator(buffer)) !== -1) {
        const frame = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx).replace(/^(\r?\n){1,2}/, "");
        const evt = parseSseFrame(frame, mapEvent);
        if (evt) yield evt;
      }
    }
    // Final flush
    if (buffer.trim()) {
      const evt = parseSseFrame(buffer, mapEvent);
      if (evt) yield evt;
    }
  } finally {
    reader.releaseLock();
  }
}

function indexOfFrameSeparator(s: string): number {
  const a = s.indexOf("\n\n");
  const b = s.indexOf("\r\n\r\n");
  if (a === -1) return b;
  if (b === -1) return a;
  return Math.min(a, b);
}

function parseSseFrame(
  frame: string,
  mapEvent?: (raw: unknown) => StreamEvent | null
): StreamEvent | null {
  const dataLines: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;

  const data = dataLines.join("\n");
  try {
    const raw = JSON.parse(data);
    if (mapEvent) return mapEvent(raw);
    return raw as StreamEvent;
  } catch {
    return null;
  }
}
