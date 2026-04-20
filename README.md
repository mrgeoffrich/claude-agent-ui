# claude-agent-ui

Reusable React UI for Claude Agent SDK message streams. Stops you from re-implementing text / thinking / tool-use / tool-result rendering in every app.

Built against the event shapes already used by `family-helper` and `mini-infra` — the `StreamEvent` union is a superset of both, so migration is mechanical.

## Packages

| Package | What's in it |
| --- | --- |
| `@claude-agent-ui/react` | Everything: types (`StreamEvent`, `ContentBlock`, `ConversationMessage`), pure reducer (`applyEvent`), transports (`sseTransport`, `iteratorTransport`), the `useAgentStream` hook, the renderer registry, default components (`ConversationView`, `TextBlock`, `ThinkingBlock`, `ToolUseBlock`), and built-in tool renderers (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task, TodoWrite). React is a peer dep (>=18); tree-shaking handles imports that don't need React (reducer, transports). |
| `@claude-agent-ui/tailwind-preset` | Optional default styling — either import the CSS file or spread the class-name helpers. Components are headless without it. |

## Design

- **Transport-agnostic.** `useAgentStream` takes any object implementing `Transport`. Use `sseTransport` for the family-helper pattern (POST → SSE), or `iteratorTransport` to wrap anything else (Node generator, Socket.IO, postMessage, tests).
- **Normalized event union.** One `StreamEvent` type covers text, thinking (with redaction), tool_use streaming + input + result, and turn completion. Your backend either emits this shape directly or passes a `mapEvent` fn to the transport.
- **Pure reducer.** `applyEvent(blocks, event)` is pure — unit-testable, replay-able from persisted events, and safe to use in `setState` updaters.
- **Renderer registry.** Instead of a 200-line `switch` on tool name, register a component per tool. `DefaultToolRenderer` covers the fallback case; `builtInToolRenderers` gives you nicer defaults for the common SDK tools.
- **Slots, not monoliths.** `ConversationView` accepts slot overrides for each piece (`Text`, `Thinking`, `ToolUse`, `UserMessage`, `AssistantMessage`) so you can layer in markdown, Radix collapsibles, or shadcn styling without forking.
- **Headless + optional styles.** Components emit `data-cau-*` attributes; supply your own CSS, Tailwind classes, or import `@claude-agent-ui/tailwind-preset/styles.css` for a zero-config look.

## Quick start

```tsx
import {
  useAgentStream,
  sseTransport,
  ConversationView,
  DefaultToolRenderer,
  builtInToolRenderers,
} from "@claude-agent-ui/react";
import "@claude-agent-ui/tailwind-preset/styles.css";

const transport = sseTransport({
  url: (input) => `/api/conversations/${input.conversationId}/messages`,
});

const registry = {
  tools: builtInToolRenderers,
  fallback: DefaultToolRenderer,
};

export function Chat({ conversationId }: { conversationId: string }) {
  const { messages, currentBlocks, status, sendMessage, stop } =
    useAgentStream({ transport });

  return (
    <>
      <ConversationView
        messages={messages}
        currentBlocks={currentBlocks}
        registry={registry}
      />
      <ChatInput
        disabled={status === "streaming"}
        onSend={(text) => sendMessage(text, { conversationId })}
        onStop={stop}
      />
    </>
  );
}
```

## Stream event shape

Your backend should emit newline-delimited SSE frames of JSON matching `StreamEvent`:

```ts
type StreamEvent =
  | { type: "text_start"; index: number }
  | { type: "text_delta"; index: number; text: string }
  | { type: "text_done"; index: number }
  | { type: "thinking_start"; index: number; redacted?: boolean }
  | { type: "thinking_delta"; index: number; thinking: string }
  | { type: "thinking_done"; index: number; signature?: string }
  | { type: "tool_use_start"; index: number; id: string; name: string }
  | { type: "tool_use_input"; index: number; partialJson: string }
  | { type: "tool_use_done"; index: number; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; name?: string; output: string; isError?: boolean }
  | { type: "done"; messageId?: string; usage?: Usage; durationMs?: number; cost?: number }
  | { type: "error"; error: string };
```

If your events use different names, pass `mapEvent` to `sseTransport` to translate.

## Custom tool renderers

```tsx
import type { ToolRenderer } from "@claude-agent-ui/react";

const DeployRenderer: ToolRenderer = ({ input, result, status }) => (
  <div>
    <strong>Deploy</strong> → {String(input?.stack_name ?? "?")}{" "}
    <em>({status})</em>
    {result && <pre>{result.output}</pre>}
  </div>
);

const registry = {
  tools: { ...builtInToolRenderers, deploy_stack: DeployRenderer },
  fallback: DefaultToolRenderer,
};
```

For MCP tools, register against the full reported name (e.g. `mcp__mini-infra-infra__list_containers`).

## Replaying persisted events

If you store the raw event stream server-side, rehydrate the UI with `reduceEvents`:

```ts
import { reduceEvents } from "@claude-agent-ui/react";

const blocks = reduceEvents(persistedEvents);
```

## Development

Uses a pnpm workspace with TypeScript project references.

```bash
pnpm install
pnpm build            # build all packages
pnpm dev              # watch mode for all packages
pnpm -w --filter @claude-agent-ui/react typecheck
```

## Releasing

Tag-driven. A push of a `v*` tag triggers `.github/workflows/publish.yml`, which verifies every `packages/*/package.json` version matches the tag, builds, and publishes both packages to npm with provenance.

```bash
pnpm bump 0.1.1           # or: patch | minor | major
git commit -am "chore: release v0.1.1"
git tag v0.1.1
git push && git push --tags
```

Prerequisites:
- `NPM_TOKEN` repo secret with `publish` rights on the target scope (Settings → Secrets → Actions).
- The npm scope in each package's `name` must be one you own. If `@claude-agent-ui` isn't yours, rename to e.g. `@<your-username>/claude-agent-ui-react` before the first publish.

## Status

0.1.0 — usable but pre-stable. Everything public is subject to change until 0.x → 1.0. Built primarily to replace the duplicated message-rendering code in `family-helper` and `mini-infra`.
