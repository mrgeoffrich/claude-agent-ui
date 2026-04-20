import type { ComponentType, ReactNode } from "react";
import type {
  AssistantMessage,
  ContentBlock,
  ConversationMessage,
  TextContentBlock,
  ThinkingContentBlock,
  ToolUseContentBlock,
  UserMessage,
} from "../types.js";
import type { RendererRegistry } from "../registry.js";
import { TextBlock } from "./text-block.js";
import { ThinkingBlock } from "./thinking-block.js";
import { ToolUseBlock } from "./tool-use-block.js";

/**
 * Optional slot overrides. Supply only the ones you want to replace; the rest
 * fall back to the library defaults. Useful when (e.g.) you want markdown
 * rendering for assistant text while keeping our thinking/tool defaults.
 */
export interface ConversationSlots {
  UserMessage?: ComponentType<{ message: UserMessage }>;
  AssistantMessage?: ComponentType<{
    message: AssistantMessage;
    children: ReactNode;
  }>;
  Text?: ComponentType<{ block: TextContentBlock }>;
  Thinking?: ComponentType<{ block: ThinkingContentBlock }>;
  ToolUse?: ComponentType<{ block: ToolUseContentBlock }>;
  Empty?: ComponentType;
}

export interface ConversationViewProps {
  messages: ConversationMessage[];
  /** Blocks from the currently streaming turn. Render after `messages`. */
  currentBlocks?: ContentBlock[];
  registry: RendererRegistry;
  slots?: ConversationSlots;
  className?: string;
}

/**
 * Default, composable renderer for a full conversation. Headless in the sense
 * that it only applies `data-cau-*` attributes for styling hooks — bring your
 * own CSS or layer in `@claude-agent-ui/tailwind-preset`.
 */
export function ConversationView({
  messages,
  currentBlocks = [],
  registry,
  slots,
  className,
}: ConversationViewProps) {
  const UserBubble = slots?.UserMessage ?? DefaultUserMessage;
  const AssistantWrapper = slots?.AssistantMessage ?? DefaultAssistantMessage;

  if (messages.length === 0 && currentBlocks.length === 0) {
    const Empty = slots?.Empty;
    return (
      <div className={className} data-cau-conversation data-cau-empty="true">
        {Empty ? <Empty /> : null}
      </div>
    );
  }

  return (
    <div className={className} data-cau-conversation>
      {messages.map((m) =>
        m.role === "user" ? (
          <UserBubble key={m.id} message={m} />
        ) : (
          <AssistantWrapper key={m.id} message={m}>
            <Blocks
              blocks={m.blocks}
              registry={registry}
              slots={slots}
            />
          </AssistantWrapper>
        )
      )}
      {currentBlocks.length > 0 && (
        <div data-cau-message="assistant" data-cau-streaming="true">
          <Blocks
            blocks={currentBlocks}
            registry={registry}
            slots={slots}
          />
        </div>
      )}
    </div>
  );
}

interface BlocksProps {
  blocks: ContentBlock[];
  registry: RendererRegistry;
  slots?: ConversationSlots;
}

function Blocks({ blocks, registry, slots }: BlocksProps) {
  const Text = slots?.Text ?? (({ block }) => <TextBlock block={block} />);
  const Thinking =
    slots?.Thinking ?? (({ block }) => <ThinkingBlock block={block} />);
  const ToolUse =
    slots?.ToolUse ??
    (({ block }) => <ToolUseBlock block={block} registry={registry} />);

  return (
    <>
      {blocks.map((b) => {
        if (b.type === "text") {
          return <Text key={`t-${b.index}`} block={b} />;
        }
        if (b.type === "thinking") {
          return <Thinking key={`th-${b.index}`} block={b} />;
        }
        return <ToolUse key={`tu-${b.index}-${b.id}`} block={b} />;
      })}
    </>
  );
}

function DefaultUserMessage({ message }: { message: UserMessage }) {
  return (
    <div data-cau-message="user">
      <div data-cau-message-content style={{ whiteSpace: "pre-wrap" }}>
        {message.content}
      </div>
    </div>
  );
}

function DefaultAssistantMessage({
  children,
}: {
  message: AssistantMessage;
  children: ReactNode;
}) {
  return <div data-cau-message="assistant">{children}</div>;
}
