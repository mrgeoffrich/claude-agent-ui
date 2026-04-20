/**
 * Helper class-name builders that pair with `@mrgeoffrich/claude-agent-ui-react`'s
 * `data-cau-*` attributes. Pass into the `className` prop of the matching
 * components when you want the default Tailwind look.
 *
 * Alternatively, import `@mrgeoffrich/claude-agent-ui-tailwind-preset/styles.css` at the
 * root of your app for raw CSS that targets the same attributes (no Tailwind
 * required).
 */

export const conversationClass =
  "flex flex-col gap-4 p-4";

export const userMessageClass =
  "self-end max-w-[80%] rounded-lg bg-blue-600 px-3 py-2 text-white";

export const assistantMessageClass =
  "self-start max-w-[90%] rounded-lg bg-gray-100 px-3 py-2 text-gray-900 dark:bg-gray-800 dark:text-gray-100";

export const textBlockClass = "prose prose-sm max-w-none dark:prose-invert";

export const thinkingBlockClass =
  "rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400";

export const toolUseBlockClass =
  "rounded border border-gray-300 bg-white p-2 text-sm dark:border-gray-700 dark:bg-gray-900";

export const toolInputClass =
  "rounded bg-gray-50 px-2 py-1 font-mono text-xs dark:bg-gray-800";

export const toolOutputClass =
  "mt-1 rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200";

export const toolErrorClass = "border-red-300 bg-red-50 text-red-800";
