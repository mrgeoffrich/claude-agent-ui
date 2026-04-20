# claude-agent-ui

Reusable React UI for Claude Agent SDK message streams. Stops you from re-implementing text / thinking / tool-use / tool-result rendering in every app.

Built against the event shapes already used by `family-helper` and `mini-infra` — the `StreamEvent` union is a superset of both, so migration is mechanical.

## Packages

| Package | What's in it |
| --- | --- |
| `@mrgeoffrich/claude-agent-ui-react` | Everything: types (`StreamEvent`, `ContentBlock`, `ConversationMessage`), pure reducer (`applyEvent`), transports (`sseTransport`, `iteratorTransport`), the `useAgentStream` hook, the renderer registry, default components (`ConversationView`, `TextBlock`, `ThinkingBlock`, `ToolUseBlock`), and built-in tool renderers (Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, Task, TodoWrite). React is a peer dep (>=18); tree-shaking handles imports that don't need React (reducer, transports). |
| `@mrgeoffrich/claude-agent-ui-tailwind-preset` | Optional default styling — either import the CSS file or spread the class-name helpers. Components are headless without it. |

## Design

- **Transport-agnostic.** `useAgentStream` takes any object implementing `Transport`. Use `sseTransport` for the family-helper pattern (POST → SSE), or `iteratorTransport` to wrap anything else (Node generator, Socket.IO, postMessage, tests).
- **Normalized event union.** One `StreamEvent` type covers text, thinking (with redaction), tool_use streaming + input + result, and turn completion. Your backend either emits this shape directly or passes a `mapEvent` fn to the transport.
- **Pure reducer.** `applyEvent(blocks, event)` is pure — unit-testable, replay-able from persisted events, and safe to use in `setState` updaters.
- **Renderer registry.** Instead of a 200-line `switch` on tool name, register a component per tool. `DefaultToolRenderer` covers the fallback case; `builtInToolRenderers` gives you nicer defaults for the common SDK tools.
- **Slots, not monoliths.** `ConversationView` accepts slot overrides for each piece (`Text`, `Thinking`, `ToolUse`, `UserMessage`, `AssistantMessage`) so you can layer in markdown, Radix collapsibles, or shadcn styling without forking.
- **Headless + optional styles.** Components emit `data-cau-*` attributes; supply your own CSS, Tailwind classes, or import `@mrgeoffrich/claude-agent-ui-tailwind-preset/styles.css` for a zero-config look.

## Quick start

```tsx
import {
  useAgentStream,
  sseTransport,
  ConversationView,
  DefaultToolRenderer,
  builtInToolRenderers,
} from "@mrgeoffrich/claude-agent-ui-react";
import "@mrgeoffrich/claude-agent-ui-tailwind-preset/styles.css";

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
import type { ToolRenderer } from "@mrgeoffrich/claude-agent-ui-react";

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
import { reduceEvents } from "@mrgeoffrich/claude-agent-ui-react";

const blocks = reduceEvents(persistedEvents);
```

## Development

Uses a pnpm workspace with TypeScript project references.

```bash
pnpm install
pnpm build            # build all packages
pnpm dev              # watch mode for all packages
pnpm -w --filter @mrgeoffrich/claude-agent-ui-react typecheck
```

## Releasing

Release-driven. Publishing [`.github/workflows/publish.yml`](.github/workflows/publish.yml) fires when a **GitHub Release** is published, verifies every `packages/*/package.json` version matches the release tag, builds, typechecks, and publishes via **npm Trusted Publishing (OIDC)** — no long-lived `NPM_TOKEN` secret required.

```bash
pnpm bump 0.1.1           # or: patch | minor | major
git commit -am "chore: release v0.1.1"
git tag v0.1.1
git push --follow-tags

gh release create v0.1.1 --generate-notes
```

### One-time setup

The very first publish of each package cannot use OIDC — npm needs the package to exist before a Trusted Publisher can be configured for it. So the rollout is:

1. **First publish (manual, token-based).** From the repo root:
   ```bash
   pnpm install
   pnpm -r build
   cd packages/react && npm publish
   cd ../tailwind-preset && npm publish
   ```
   Use an **Automation** token from <https://www.npmjs.com/settings/~/tokens> (bypasses 2FA), written to `~/.npmrc`:
   ```bash
   npm config set //registry.npmjs.org/:_authToken <npm_xxx>
   ```
2. **Configure the `npm` GitHub environment.** In the repo settings → Environments, create an environment called `npm`. (The publish workflow uses `environment: npm`, matching npm's Trusted Publisher.)
3. **Register a Trusted Publisher for each package.** On npmjs.com → *your package* → Settings → Trusted publishing → Add:
   - Organization/user: `mrgeoffrich`
   - Repository: `claude-agent-ui`
   - Workflow filename: `publish.yml`
   - Environment: `npm`
4. **Future releases** — `pnpm bump`, commit + tag + push, then `gh release create`. The workflow handles the rest.

### Requirements

- Node 22.14+ and npm 11.5.1+ (the workflow upgrades npm automatically).
- `repository.url` in each package.json must exactly match the GitHub repo URL.
- pnpm does not yet support OIDC publishing ([pnpm#9812](https://github.com/pnpm/pnpm/issues/9812)); the workflow shells out to `npm publish` per package.

## Status

0.1.0 — usable but pre-stable. Everything public is subject to change until 0.x → 1.0. Built primarily to replace the duplicated message-rendering code in `family-helper` and `mini-infra`.
