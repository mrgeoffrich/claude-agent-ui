# @mrgeoffrich/claude-agent-ui-tailwind-preset

Optional default styling for `@mrgeoffrich/claude-agent-ui-react`.

## Two ways to use it

**1. Raw CSS (no Tailwind required).** Import once at the root of your app:

```ts
import "@mrgeoffrich/claude-agent-ui-tailwind-preset/styles.css";
```

Styles target the `data-cau-*` attributes emitted by the default components.

**2. Class-name helpers.** For Tailwind consumers who want full control:

```tsx
import { conversationClass, userMessageClass } from "@mrgeoffrich/claude-agent-ui-tailwind-preset";

<ConversationView className={conversationClass} ... />
```

Both approaches coexist; pick whichever suits your app.
