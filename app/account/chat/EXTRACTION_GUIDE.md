# Chat Module Extraction Guide

This guide helps you extract and adapt the chat module for use in other applications.

## Prerequisites

- Next.js 16+ application
- Convex backend configured
- TypeScript enabled
- Tailwind CSS configured

## Step-by-Step Extraction

### Step 1: Copy Files

```bash
# Copy the entire chat directory
cp -r src/app/account/chat /path/to/new/app/src/modules/chat

# Copy Convex modules
cp -r convex/messages /path/to/new/app/convex/
cp -r convex/assistant /path/to/new/app/convex/
```

### Step 2: Update Imports

Use find/replace to update all `@/` imports:

```bash
# Find all imports
grep -r "@/.*" src/modules/chat/

# Replace with your import alias
# Example: @/ → @/lib/
```

Common imports to update:
- `@/ctx/auth` → Your auth context
- `@/hooks/use-mobile` → Your mobile hook
- `@/components/ui/*` → Your UI components
- `@/lib/icons` → Your icon system
- `@/lib/utils` → Your utils
- `@/utils/date` → Your date utils
- `@/utils/time` → Your time utils

### Step 3: Install Dependencies

```bash
bun add convex react next dompurify marked
# or
npm install convex react next dompurify marked
```

### Step 4: Set Up Convex Schema

Add to `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { messageSchema } from "./messages/d";

export default defineSchema({
  // ... your existing tables
  messages: defineTable(messageSchema)
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_sender_receiver", ["senderId", "receiverId"])
    .index("by_receiver_sender", ["receiverId", "senderId"]),
});
```

### Step 5: Create Required Contexts/Hooks

#### Auth Context

```typescript
// src/contexts/auth.tsx
export function useAuthCtx() {
  return {
    user: {
      uid: "user-id-here" // Your user ID
    }
  };
}
```

#### Mobile Hook

```typescript
// src/hooks/use-mobile.ts
export function useMobile(): boolean {
  // Implement mobile detection
  return window.innerWidth < 768;
}
```

#### Image Converter Hook

```typescript
// src/hooks/use-image-converter.ts
export function useImageConverter() {
  return {
    convert: async (file: File, options: any) => {
      // Implement image conversion
      return { blob: file };
    },
    validateImageFile: async (file: File) => {
      // Implement validation
      return null;
    },
    terminate: () => {},
  };
}
```

### Step 6: Create UI Components

Ensure these components exist or create stubs:

- `Avatar`, `AvatarFallback`, `AvatarImage`
- `ScrollArea`
- `Input` or `FlatInput`
- Icon component system

### Step 7: Create Required Convex Functions

#### Users Query

```typescript
// convex/users/q.ts
export const getByProId = query({
  args: { proId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_proId", (q) => q.eq("proId", args.proId))
      .first();
  },
});
```

#### User Profiles Query

```typescript
// convex/userProfiles/q.ts
export const getByProId = query({
  args: { proId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_proId", (q) => q.eq("proId", args.proId))
      .first();
  },
});
```

#### File Upload

```typescript
// convex/files/upload.ts
export const url = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

### Step 8: Create AI Chat API Route (Optional)

```typescript
// src/app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const { prompt, messages } = await req.json();
  
  // Implement your AI streaming logic
  // Return a ReadableStream with Server-Sent Events
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### Step 9: Update Assistant Constants

Update in both files:

```typescript
// src/modules/chat/_components/assistant.ts
export const ASSISTANT_PRO_ID = 'your-assistant-id'
export const ASSISTANT_NAME = 'Your Assistant Name'
export const ASSISTANT_AVATAR = '/path/to/avatar.png'
```

```typescript
// convex/assistant/d.ts
export const ASSISTANT_PRO_ID = 'your-assistant-id'
export const ASSISTANT_EMAIL = 'assistant@example.com'
export const ASSISTANT_NAME = 'Your Assistant Name'
export const ASSISTANT_AVATAR = '/path/to/avatar.png'
```

### Step 10: Configure Tailwind

Ensure your `tailwind.config.js` includes:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        muted: "var(--muted)",
        foreground: "var(--foreground)",
        // ... other colors
      },
    },
  },
};
```

### Step 11: Seed Assistant User (Optional)

```typescript
// convex/assistant/seed.ts
import { mutation } from "../_generated/server";
import { ASSISTANT_PRO_ID, ASSISTANT_EMAIL, ASSISTANT_NAME } from "./d";

export const seedAssistant = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if assistant exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_proId", (q) => q.eq("proId", ASSISTANT_PRO_ID))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create assistant user
    const assistantId = await ctx.db.insert("users", {
      proId: ASSISTANT_PRO_ID,
      email: ASSISTANT_EMAIL,
      displayName: ASSISTANT_NAME,
      // ... other required fields
    });

    return assistantId;
  },
});
```

## Usage in Your App

### Basic Usage

```typescript
// src/app/chat/page.tsx
import { ChatContent } from "@/modules/chat/content";
import { useAuthCtx } from "@/contexts/auth";

export default function ChatPage() {
  const { user } = useAuthCtx();

  if (!user?.uid) {
    return <div>Please sign in</div>;
  }

  return <ChatContent />;
}
```

### With Route Parameter

```typescript
// src/app/chat/[id]/page.tsx
import { ChatContent } from "@/modules/chat/content";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.id as string;

  return <ChatContent initialConversationId={conversationId} />;
}
```

## Customization

### Remove AI Assistant

1. Remove `assistant-*` components
2. Remove `use-assistant-chat.ts`
3. Remove assistant-related code from `content.tsx`
4. Remove `convex/assistant/` directory
5. Remove `/api/ai/chat` route

### Remove Audio Messages

1. Remove `use-audio-recorder.ts`
2. Remove `audio-message-player.tsx`
3. Remove audio-related code from `message-input.tsx`

### Custom Styling

Override styles by:

1. **CSS Variables**:
```css
:root {
  --primary: your-color;
  --muted: your-color;
}
```

2. **Tailwind Config**:
```javascript
module.exports = {
  theme: {
    extend: {
      // Your custom styles
    },
  },
};
```

3. **Component Wrapper**:
```typescript
<div className="your-custom-classes">
  <ChatContent />
</div>
```

## Testing Checklist

After extraction, test:

- [ ] User authentication works
- [ ] Messages send and receive
- [ ] File uploads work
- [ ] Audio messages work (if enabled)
- [ ] AI assistant works (if enabled)
- [ ] Search works
- [ ] Mobile layout works
- [ ] Desktop layout works
- [ ] Read receipts work
- [ ] Message likes work
- [ ] Unread counts work

## Troubleshooting

### "Cannot find module '@/...'"

Update all import paths to match your project structure.

### "Convex query not found"

Ensure all Convex functions are deployed:
```bash
npx convex dev
```

### "User not found"

Ensure users table has `by_proId` index and users are created with `proId` field.

### "File upload fails"

Check:
- Convex storage is configured
- `files.upload.url` mutation exists
- File size limits are appropriate

### "Messages not updating"

Check:
- Convex connection is active
- Queries are properly subscribed
- User authentication is valid

## Migration Notes

### Breaking Changes

If adapting from a different chat system:

1. **User IDs**: Module uses `proId` (Firebase UID) - adapt to your user ID system
2. **Follows System**: Requires `follows` table - implement or adapt
3. **Storage**: Uses Convex Storage - adapt to your storage system
4. **Auth**: Uses Firebase Auth pattern - adapt to your auth system

### Data Migration

If migrating existing messages:

1. Map old message structure to new schema
2. Convert file URLs to Convex storage IDs
3. Update user references to use `proId`
4. Migrate read receipts and likes

## Performance Tips

1. **Pagination**: Consider adding pagination for long conversations
2. **Image Optimization**: Already converts to WebP - ensure CDN is configured
3. **Caching**: Convex handles caching automatically
4. **Bundle Size**: Tree-shake unused components

## Security Checklist

- [ ] User authentication enforced
- [ ] Authorization checks in place
- [ ] File type validation
- [ ] File size limits
- [ ] Content sanitization (for assistant markdown)
- [ ] Rate limiting (consider adding)
- [ ] Input validation

## Support

For issues:
1. Check main README.md
2. Review MODULE_STRUCTURE.md
3. Check Convex dashboard for errors
4. Review browser console

---

**Last Updated**: 2025-01-27
