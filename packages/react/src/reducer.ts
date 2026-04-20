import type { ContentBlock, StreamEvent } from "./types.js";

/**
 * Pure reducer: apply a single stream event to the current list of content
 * blocks and return a new list. Safe to use with `useReducer` or inside a
 * setState updater. Events reference blocks by `index` (for text/thinking/
 * tool_use) or `id` (for tool_result).
 */
export function applyEvent(
  blocks: ContentBlock[],
  event: StreamEvent
): ContentBlock[] {
  switch (event.type) {
    case "text_start":
      if (blocks.some((b) => b.type === "text" && b.index === event.index)) {
        return blocks;
      }
      return [
        ...blocks,
        { type: "text", index: event.index, text: "", status: "streaming" },
      ];

    case "text_delta":
      return blocks.map((b) =>
        b.type === "text" && b.index === event.index
          ? { ...b, text: b.text + event.text }
          : b
      );

    case "text_done":
      return blocks.map((b) =>
        b.type === "text" && b.index === event.index
          ? { ...b, status: "complete" }
          : b
      );

    case "thinking_start":
      if (
        blocks.some((b) => b.type === "thinking" && b.index === event.index)
      ) {
        return blocks;
      }
      return [
        ...blocks,
        {
          type: "thinking",
          index: event.index,
          thinking: "",
          redacted: event.redacted,
          status: "streaming",
        },
      ];

    case "thinking_delta":
      return blocks.map((b) =>
        b.type === "thinking" && b.index === event.index
          ? { ...b, thinking: b.thinking + event.thinking }
          : b
      );

    case "thinking_done":
      return blocks.map((b) =>
        b.type === "thinking" && b.index === event.index
          ? { ...b, signature: event.signature, status: "complete" }
          : b
      );

    case "tool_use_start":
      if (
        blocks.some((b) => b.type === "tool_use" && b.index === event.index)
      ) {
        return blocks;
      }
      return [
        ...blocks,
        {
          type: "tool_use",
          index: event.index,
          id: event.id,
          name: event.name,
          status: "streaming",
        },
      ];

    case "tool_use_input":
      return blocks.map((b) =>
        b.type === "tool_use" && b.index === event.index
          ? { ...b, partialJson: (b.partialJson ?? "") + event.partialJson }
          : b
      );

    case "tool_use_done":
      return blocks.map((b) =>
        b.type === "tool_use" && b.index === event.index
          ? { ...b, input: event.input, status: "executing" }
          : b
      );

    case "tool_result":
      return blocks.map((b) =>
        b.type === "tool_use" && b.id === event.id
          ? {
              ...b,
              result: { output: event.output, isError: event.isError },
              status: "complete",
            }
          : b
      );

    case "done":
    case "error":
      return blocks;
  }
}

/**
 * Fold a sequence of events into a final block list. Handy for persistence →
 * UI: replay stored events through the same reducer the live stream uses.
 */
export function reduceEvents(events: Iterable<StreamEvent>): ContentBlock[] {
  let blocks: ContentBlock[] = [];
  for (const e of events) blocks = applyEvent(blocks, e);
  return blocks;
}

/**
 * Mark any blocks still in `streaming` or `executing` as `complete`. Call when
 * a stream ends (gracefully or via abort) so the UI stops showing loaders.
 */
export function finalizeBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((b) =>
    b.status === "complete" ? b : { ...b, status: "complete" }
  );
}
