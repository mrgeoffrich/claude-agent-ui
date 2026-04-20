# @mrgeoffrich/claude-agent-ui-react

Single-package React UI for Claude Agent SDK message streams. Ships with:

- **Types** — `StreamEvent`, `ContentBlock`, `ConversationMessage`, `Transport`, `Usage`, etc.
- **Reducer** — `applyEvent`, `reduceEvents`, `finalizeBlocks` (pure; safe outside React).
- **Transports** — `sseTransport({ url, headers?, body?, mapEvent? })`, `iteratorTransport(fn)`.
- **Hook** — `useAgentStream({ transport, onEvent?, onTurnComplete?, onError?, initialMessages? })`.
- **Registry** — `RendererRegistry`, `ToolRenderer`, `resolveToolRenderer`.
- **Components** — `ConversationView`, `TextBlock`, `ThinkingBlock`, `ToolUseBlock`, `DefaultToolRenderer`, `builtInToolRenderers`, and individual built-ins (`ReadRenderer`, `BashRenderer`, …).

React is a peer dependency (>=18). Everything is tree-shakable; importing just the reducer or transports does not pull React in.

See the repo README for a full usage example.
