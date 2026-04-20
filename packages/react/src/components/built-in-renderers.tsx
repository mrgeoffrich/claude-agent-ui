import type { ToolRenderer } from "../registry.js";

/**
 * Built-in renderers for common Claude Agent SDK tools. These are intentionally
 * lightweight — they format the input in a more readable way than the generic
 * JSON dump. Import and spread into your registry selectively:
 *
 *   const registry = {
 *     tools: { ...builtInToolRenderers, MyTool: MyRenderer },
 *     fallback: DefaultToolRenderer,
 *   };
 */

const Line = ({ label, value }: { label: string; value: string }) => (
  <div data-cau-tool-line>
    <span data-cau-tool-label>{label}: </span>
    <code>{value}</code>
  </div>
);

const Output = ({
  result,
}: {
  result?: { output: string; isError?: boolean };
}) =>
  result ? (
    <pre
      data-cau-tool-output
      data-cau-tool-error={result.isError ? "true" : undefined}
      style={{ whiteSpace: "pre-wrap" }}
    >
      {result.output.length > 4000
        ? `${result.output.slice(0, 4000)}\n… (${result.output.length - 4000} more chars)`
        : result.output}
    </pre>
  ) : null;

export const ReadRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Read">
    <strong>Read</strong>
    {typeof input?.file_path === "string" && (
      <Line label="file" value={input.file_path} />
    )}
    {status !== "complete" && <em> reading…</em>}
    <Output result={result} />
  </div>
);

export const WriteRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Write">
    <strong>Write</strong>
    {typeof input?.file_path === "string" && (
      <Line label="file" value={input.file_path} />
    )}
    {typeof input?.content === "string" && (
      <Line
        label="bytes"
        value={String((input.content as string).length)}
      />
    )}
    {status !== "complete" && <em> writing…</em>}
    <Output result={result} />
  </div>
);

export const EditRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Edit">
    <strong>Edit</strong>
    {typeof input?.file_path === "string" && (
      <Line label="file" value={input.file_path} />
    )}
    {status !== "complete" && <em> editing…</em>}
    <Output result={result} />
  </div>
);

export const BashRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Bash">
    <strong>Bash</strong>
    {typeof input?.command === "string" && (
      <pre data-cau-tool-input style={{ whiteSpace: "pre-wrap" }}>
        ${" "}
        {input.command}
      </pre>
    )}
    {status !== "complete" && <em> running…</em>}
    <Output result={result} />
  </div>
);

export const GlobRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Glob">
    <strong>Glob</strong>
    {typeof input?.pattern === "string" && (
      <Line label="pattern" value={input.pattern} />
    )}
    {typeof input?.path === "string" && (
      <Line label="path" value={input.path} />
    )}
    {status !== "complete" && <em> globbing…</em>}
    <Output result={result} />
  </div>
);

export const GrepRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Grep">
    <strong>Grep</strong>
    {typeof input?.pattern === "string" && (
      <Line label="pattern" value={input.pattern} />
    )}
    {typeof input?.path === "string" && (
      <Line label="path" value={input.path} />
    )}
    {status !== "complete" && <em> searching…</em>}
    <Output result={result} />
  </div>
);

export const WebFetchRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="WebFetch">
    <strong>WebFetch</strong>
    {typeof input?.url === "string" && <Line label="url" value={input.url} />}
    {status !== "complete" && <em> fetching…</em>}
    <Output result={result} />
  </div>
);

export const WebSearchRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="WebSearch">
    <strong>WebSearch</strong>
    {typeof input?.query === "string" && (
      <Line label="query" value={input.query} />
    )}
    {status !== "complete" && <em> searching…</em>}
    <Output result={result} />
  </div>
);

export const TaskRenderer: ToolRenderer = ({ input, result, status }) => (
  <div data-cau-tool="Task">
    <strong>Task</strong>
    {typeof input?.subagent_type === "string" && (
      <Line label="agent" value={input.subagent_type} />
    )}
    {typeof input?.description === "string" && (
      <Line label="description" value={input.description} />
    )}
    {status !== "complete" && <em> delegating…</em>}
    <Output result={result} />
  </div>
);

export const TodoWriteRenderer: ToolRenderer = ({ input, status }) => {
  const todos = Array.isArray(input?.todos)
    ? (input.todos as Array<{
        content: string;
        status: string;
        activeForm?: string;
      }>)
    : null;
  return (
    <div data-cau-tool="TodoWrite">
      <strong>Todos</strong>
      {status !== "complete" && <em> updating…</em>}
      {todos && (
        <ul data-cau-tool-todos>
          {todos.map((t, i) => (
            <li key={i} data-cau-todo-status={t.status}>
              [{todoMarker(t.status)}]{" "}
              {t.status === "in_progress" && t.activeForm
                ? t.activeForm
                : t.content}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function todoMarker(s: string): string {
  if (s === "completed") return "x";
  if (s === "in_progress") return "~";
  return " ";
}

/**
 * Bundle of all built-ins. Spread into your registry; override individual
 * entries as needed.
 */
export const builtInToolRenderers: Record<string, ToolRenderer> = {
  Read: ReadRenderer,
  Write: WriteRenderer,
  Edit: EditRenderer,
  Bash: BashRenderer,
  Glob: GlobRenderer,
  Grep: GrepRenderer,
  WebFetch: WebFetchRenderer,
  WebSearch: WebSearchRenderer,
  Task: TaskRenderer,
  TodoWrite: TodoWriteRenderer,
};
