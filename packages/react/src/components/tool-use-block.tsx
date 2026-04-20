import type { ToolUseContentBlock } from "../types.js";
import { resolveToolRenderer, type RendererRegistry } from "../registry.js";

export interface ToolUseBlockProps {
  block: ToolUseContentBlock;
  registry: RendererRegistry;
  className?: string;
}

/**
 * Delegates to the registry's renderer for the block's tool name, falling
 * back to `registry.fallback` when no specific renderer is registered.
 */
export function ToolUseBlock({
  block,
  registry,
  className,
}: ToolUseBlockProps) {
  const Renderer = resolveToolRenderer(registry, block.name);
  return (
    <div
      className={className}
      data-cau-block="tool_use"
      data-cau-tool={block.name}
      data-cau-status={block.status}
    >
      <Renderer
        toolId={block.id}
        toolName={block.name}
        input={block.input}
        partialJson={block.partialJson}
        result={block.result}
        status={block.status}
      />
    </div>
  );
}
