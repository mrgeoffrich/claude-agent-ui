import type { TextContentBlock } from "../types.js";

export interface TextBlockProps {
  block: TextContentBlock;
  className?: string;
}

/**
 * Default text block renderer. Shows the streaming text as-is with a blinking
 * cursor while the block is still streaming. Wrap or override to render
 * markdown (e.g. `react-markdown`) — pass `block.text` through your renderer.
 */
export function TextBlock({ block, className }: TextBlockProps) {
  return (
    <div
      className={className}
      data-cau-block="text"
      data-cau-status={block.status}
    >
      <span style={{ whiteSpace: "pre-wrap" }}>{block.text}</span>
      {block.status === "streaming" && (
        <span aria-hidden="true" data-cau-cursor>
          ▍
        </span>
      )}
    </div>
  );
}
