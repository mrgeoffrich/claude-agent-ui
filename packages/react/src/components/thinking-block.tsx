import { useState } from "react";
import type { ThinkingContentBlock } from "../types.js";

export interface ThinkingBlockProps {
  block: ThinkingContentBlock;
  /** Whether the block is initially expanded. Defaults to false. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Default thinking block renderer. Collapsible; shows a redaction placeholder
 * when `block.redacted` is set. Consumers can replace this via the `Thinking`
 * slot on `ConversationView`.
 */
export function ThinkingBlock({
  block,
  defaultOpen = false,
  className,
}: ThinkingBlockProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (block.redacted) {
    return (
      <div
        className={className}
        data-cau-block="thinking"
        data-cau-redacted="true"
        data-cau-status={block.status}
      >
        <em>Thinking hidden for safety.</em>
      </div>
    );
  }

  return (
    <details
      className={className}
      data-cau-block="thinking"
      data-cau-status={block.status}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        {block.status === "streaming" ? "Thinking…" : "Thoughts"}
      </summary>
      <div style={{ whiteSpace: "pre-wrap" }}>{block.thinking}</div>
    </details>
  );
}
