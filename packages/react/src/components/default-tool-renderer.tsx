import type { ToolRenderer } from "../registry.js";

/**
 * Generic fallback renderer. Shows the tool name, a compact preview of the
 * input JSON, and the output (truncated). Designed to be legible without any
 * styling and to degrade gracefully when only partial data is available.
 */
export const DefaultToolRenderer: ToolRenderer = ({
  toolName,
  input,
  partialJson,
  result,
  status,
}) => {
  const inputPreview =
    input !== undefined
      ? JSON.stringify(input, null, 2)
      : partialJson ?? "";

  return (
    <div data-cau-tool-default>
      <div data-cau-tool-header>
        <strong>{toolName}</strong>
        <span data-cau-tool-status>{statusLabel(status)}</span>
      </div>
      {inputPreview && (
        <pre data-cau-tool-input style={{ whiteSpace: "pre-wrap" }}>
          {inputPreview}
        </pre>
      )}
      {result && (
        <pre
          data-cau-tool-output
          data-cau-tool-error={result.isError ? "true" : undefined}
          style={{ whiteSpace: "pre-wrap" }}
        >
          {truncate(result.output, 4000)}
        </pre>
      )}
    </div>
  );
};

function statusLabel(s: string): string {
  switch (s) {
    case "streaming":
      return "preparing…";
    case "executing":
      return "running…";
    case "complete":
      return "done";
    default:
      return s;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… (${s.length - max} more chars)`;
}
