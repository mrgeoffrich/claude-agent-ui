import type { ComponentType } from "react";
import type { BlockStatus } from "./types.js";

export interface ToolRendererProps {
  toolId: string;
  toolName: string;
  /** Fully-assembled input, available once the tool_use block is complete. */
  input?: Record<string, unknown>;
  /** Raw partial JSON while input is still streaming. */
  partialJson?: string;
  result?: { output: string; isError?: boolean };
  status: BlockStatus;
}

export type ToolRenderer = ComponentType<ToolRendererProps>;

export interface RendererRegistry {
  /**
   * Map of tool name → renderer. Tool names match what the SDK reports, e.g.
   * `Read`, `Bash`, `mcp__my-server__my-tool`. Use glob-free exact match; for
   * MCP prefix matching register against the full name.
   */
  tools?: Record<string, ToolRenderer>;
  /** Rendered when no entry in `tools` matches. Required. */
  fallback: ToolRenderer;
}

export function resolveToolRenderer(
  registry: RendererRegistry,
  toolName: string
): ToolRenderer {
  return registry.tools?.[toolName] ?? registry.fallback;
}
