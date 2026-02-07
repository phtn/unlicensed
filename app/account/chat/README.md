# Chat Module Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Components](#components)
5. [Hooks](#hooks)
6. [Convex Backend](#convex-backend)
7. [Features](#features)
8. [Dependencies](#dependencies)
9. [Usage Guide](#usage-guide)
10. [API Reference](#api-reference)
11. [Module Extraction Guide](#module-extraction-guide)

---

## Overview

The Chat Module is a comprehensive real-time messaging system built with Next.js, React, and Convex. It provides:

- **Real-time messaging** between connected users
- **AI Assistant chat** with streaming responses
- **File attachments** (images, PDFs, audio messages)
- **Message reactions** (likes)
- **Read receipts** and unread message tracking
- **Conversation search** functionality
- **Mobile-responsive** design with adaptive layouts
- **Optimistic updates** for instant UI feedback

### Key Technologies

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Convex (real-time database)
- **Storage**: Convex File Storage
- **AI**: Cohere API (for assistant chat)
- **Styling**: Tailwind CSS, Radix UI components

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat Module                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   Content    │────────▶│  Components  │                  │
│  │   (Main)     │         │  (UI Layer)  │                  │
│  └──────────────┘         └──────────────┘                  │
│         │                           │                         │
│         │                           │                         │
│         ▼                           ▼                         │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │    Hooks     │────────▶│   Convex     │                  │
│  │  (Business)  │         │  (Backend)    │                  │
│  └──────────────┘         └──────────────┘                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Component triggers hook/action
2. **Optimistic Update** → UI updates immediately
3. **Convex Mutation** → Backend processes request
4. **Real-time Subscription** → Convex automatically updates UI
5. **Reconciliation** → Optimistic update replaced with server data

---

## File Structure

```
src/app/account/chat/
├── page.tsx                          # Main chat page (auth wrapper)
├── content.tsx                       # Main chat content component
├── [id]/
│   └── page.tsx                     # Conversation detail page
└── _components/
    ├── assistant.ts                  # Assistant constants & types
    ├── assistant-message-input.tsx   # AI assistant input component
    ├── assistant-message-list.tsx   # AI assistant messages display
    ├── audio-message-player.tsx     # Audio playback component
    ├── conversation-list.tsx        # Conversation sidebar list
    ├── conversation-search.tsx      # Search input component
    ├── message-bubble.tsx            # Individual message bubble
    ├── message-bubble-attachments.tsx # Attachment display
    ├── message-bubble-timestamp.tsx  # Timestamp & like UI
    ├── message-group.tsx             # Grouped messages by date
    ├── message-input.tsx             # Main message input (text/files/audio)
    ├── message-list.tsx              # Messages container
    ├── message-list-hooks.ts         # Message grouping hooks
    ├── message-list-image-modal.tsx  # Fullscreen image viewer
    ├── message-list-types.ts         # TypeScript type definitions
    ├── message-list-utils.ts        # Utility functions
    ├── sfx.tsx                       # Sound effects component
    ├── use-assistant-chat.ts         # Assistant chat hook
    ├── use-audio-recorder.ts         # Audio recording hook
    └── use-chat-sfx.ts               # Chat sound effects hook
```

---

## Components

### Core Components

#### `ChatContent` (`content.tsx`)

Main orchestrator component that manages:
- Conversation list and chat area layout
- Mobile/desktop responsive behavior
- Assistant vs regular chat switching
- Real-time message subscriptions
- Optimistic updates
- Auto-scrolling behavior

**Props:**
```typescript
interface ChatContentProps {
  initialConversationId?: string
}
```

**Key Features:**
- Dual-pane layout (conversations list + chat area)
- Mobile: Single pane with navigation
- Desktop: Side-by-side layout
- Real-time updates via Convex reactivity
- Optimistic message updates
- Auto-scroll to bottom on new messages

#### `MessageList` (`message-list.tsx`)

Displays messages in a conversation with:
- Date grouping
- Read receipts
- Image modal
- Message reactions (likes)
- Loading states

**Props:**
```typescript
interface MessageListProps {
  messages: Message[] | undefined
  currentUserProId: string
  otherUserProId: string
  onOptimisticLike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
  onOptimisticUnlike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
}
```

#### `MessageInput` (`message-input.tsx`)

Multi-mode input component supporting:
- Text messages
- File attachments (images, PDFs)
- Voice messages (recording)
- Auto-resizing textarea
- File upload with preview

**Props:**
```typescript
interface MessageInputProps {
  receiverProId: string
  senderProId: string
  onMessageSent?: () => void
  onOptimisticMessage?: (content: string, attachments?: Attachment[]) => void
}
```

**Modes:**
1. **Text Mode**: Standard text input with file picker
2. **Recording Mode**: Audio recording with timer and waveform
3. **Preview Mode**: Audio preview before sending

#### `ConversationList` (`conversation-list.tsx`)

Displays list of conversations with:
- User avatars
- Last message preview
- Unread count badges
- Audio/image attachment indicators
- Timestamp formatting

#### `AssistantMessageList` (`assistant-message-list.tsx`)

Displays AI assistant conversation with:
- Markdown rendering
- Code syntax highlighting
- Quick action buttons
- Typing indicators
- Date grouping

#### `AssistantMessageInput` (`assistant-message-input.tsx`)

Simplified input for assistant chat with:
- Auto-resizing textarea
- Send button
- Loading states

### Supporting Components

- **`MessageBubble`**: Individual message display with attachments
- **`MessageGroup`**: Groups messages by date
- **`AudioMessagePlayer`**: Audio playback with waveform visualization
- **`ConversationSearch`**: Search input with clear button
- **`ImageModal`**: Fullscreen image viewer

---

## Hooks

### `useAssistantChat`

Manages AI assistant conversation state and streaming.

**Returns:**
```typescript
interface UseAssistantChatReturn {
  messages: AssistantMessage[]
  isLoading: boolean
  isActive: boolean
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}
```

**Features:**
- Real-time message fetching from Convex
- Streaming AI responses via `/api/ai/chat`
- Message persistence to Convex
- Conversation clearing

**Usage:**
```typescript
const assistantChat = useAssistantChat()
await assistantChat.sendMessage("Hello!")
```

### `useAudioRecorder`

Manages audio recording functionality.

**Returns:**
```typescript
interface UseAudioRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
  error: string | null
}
```

**Features:**
- Browser MediaRecorder API
- Pause/resume support
- Timer tracking
- Multiple format support (webm, ogg, mp4)

### `useGroupedMessages`

Groups messages by date for display.

**Input:** `Message[] | undefined`
**Output:** `MessageGroup[]`

### `useLastReadMessageId`

Finds the last read message ID for read receipt display.

**Input:** `Message[] | undefined`, `User | null | undefined`
**Output:** `Id<'messages'> | null`

---

## Convex Backend

### Database Schema

#### `messages` Table

```typescript
{
  senderId: Id<'users'>           // Message sender
  receiverId: Id<'users'>         // Message receiver
  content: string                 // Message text (or duration for audio)
  createdAt: string               // ISO timestamp
  readAt: string | null           // ISO timestamp when read
  visible: boolean                // Soft delete flag
  attachments?: Array<{           // File attachments
    storageId: Id<'_storage'>
    fileName: string
    fileType: string
    fileSize: number
    url: string | null
  }>
  likes?: Array<{                 // Message reactions
    userId: Id<'users'>
    likedAt: string
  }>
}
```

**Indexes:**
- `by_sender`: All messages sent by a user
- `by_receiver`: All messages received by a user
- `by_sender_receiver`: Messages between two specific users
- `by_receiver_sender`: Messages between two specific users (reverse)

### Queries (`convex/messages/q.ts`)

#### `getConversations`

Get all conversations for a user.

**Args:**
```typescript
{
  userProId: string
}
```

**Returns:**
```typescript
Array<{
  otherUserId: string
  otherUser: User | null
  lastMessage: Message
  unreadCount: number
  hasMessages: boolean
}>
```

**Features:**
- Includes all connected users (follows/followers)
- Shows users without messages yet
- Sorted by last message time
- Excludes assistant

#### `getMessages`

Get messages between two users.

**Args:**
```typescript
{
  currentUserProId: string
  otherUserProId: string
}
```

**Returns:** `Message[]` with attachment URLs resolved

#### `searchConversations`

Search conversations by user name, email, or message content.

**Args:**
```typescript
{
  userProId: string
  searchQuery: string
}
```

**Returns:** Same format as `getConversations`, filtered by search

#### `getUnreadCount`

Get total unread message count for a user.

**Args:**
```typescript
{
  userProId: string
}
```

**Returns:** `number`

#### `areConnected`

Check if two users are connected (either follows the other).

**Args:**
```typescript
{
  user1ProId: string
  user2ProId: string
}
```

**Returns:** `boolean`

### Mutations (`convex/messages/m.ts`)

#### `sendMessage`

Send a message to another user.

**Args:**
```typescript
{
  receiverProId: string
  senderProId: string
  content: string
  attachments?: Array<{
    storageId: Id<'_storage'>
    fileName: string
    fileType: string
    fileSize: number
  }>
}
```

**Returns:** `Id<'messages'>`

**Features:**
- Validates user connection (follow relationship)
- Prevents self-messaging
- Generates attachment URLs
- Sends push notifications
- Validates content or attachments required

#### `likeMessage`

Toggle like on a message.

**Args:**
```typescript
{
  messageId: Id<'messages'>
  userProId: string
}
```

**Returns:**
```typescript
{
  liked: boolean
  likesCount: number
}
```

#### `markAsRead`

Mark all messages from a sender as read.

**Args:**
```typescript
{
  senderProId: string
  receiverProId: string
}
```

**Returns:** `number` (count of messages marked as read)

#### `deleteMessage`

Soft delete a message (sets `visible: false`).

**Args:**
```typescript
{
  messageId: Id<'messages'>
  userProId: string
}
```

**Returns:** `Id<'messages'>`

**Security:** Only sender or receiver can delete

### Assistant Queries (`convex/assistant/q.ts`)

#### `getAssistantMessages`

Get all messages between user and assistant.

**Args:**
```typescript
{
  userProId: string
}
```

**Returns:**
```typescript
Array<{
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}>
```

#### `getAssistantUser`

Get the assistant user object.

**Returns:** `User | null`

#### `getAssistantProfile`

Get assistant profile with `isPublic` and `bio` fields.

**Returns:** `UserProfile | null`

#### `getLastAssistantMessage`

Get the last message with assistant for preview.

**Args:**
```typescript
{
  userProId: string
}
```

**Returns:**
```typescript
{
  content: string
  createdAt: string
  isFromAssistant: boolean
} | null
```

### Assistant Mutations (`convex/assistant/m.ts`)

#### `sendAssistantMessage`

Send a message to/from the assistant (bypasses follow requirement).

**Args:**
```typescript
{
  userProId: string
  content: string
  isFromAssistant: boolean
}
```

**Returns:** `Id<'messages'>`

#### `clearAssistantMessages`

Clear all messages between user and assistant (soft delete).

**Args:**
```typescript
{
  userProId: string
}
```

**Returns:** `number` (count of messages cleared)

### Assistant Constants (`convex/assistant/d.ts`)

```typescript
export const ASSISTANT_PRO_ID = 'protap-assistant-001'
export const ASSISTANT_EMAIL = 'support@protap.ph'
export const ASSISTANT_NAME = 'Protap Girl'
export const ASSISTANT_AVATAR = '/images/lana.webp'
export const ASSISTANT_USERNAME = 'protap-assistant'
```

---

## Features

### Real-Time Messaging

- **Convex Reactivity**: Messages update automatically when new ones arrive
- **Optimistic Updates**: UI updates immediately before server confirmation
- **Read Receipts**: Visual indicators when messages are read
- **Unread Counts**: Badge showing unread message count

### File Attachments

- **Supported Types**: Images (PNG, JPG, WebP), PDFs, Audio (WebM)
- **Image Conversion**: Automatic conversion to WebP format
- **File Size Limit**: 10MB per file
- **Preview**: Image previews before sending
- **Storage**: Convex File Storage with URL generation

### Audio Messages

- **Recording**: Browser MediaRecorder API
- **Formats**: WebM, OGG, MP4 (auto-detected)
- **Features**: Pause/resume, timer, waveform visualization
- **Playback**: Custom audio player with progress bar

### AI Assistant

- **Streaming Responses**: Real-time AI response streaming
- **Markdown Support**: Rendered markdown with code highlighting
- **Quick Actions**: Pre-defined suggestion buttons
- **Conversation History**: Maintains context across messages
- **Availability Check**: Checks if assistant is active (`isPublic`)

### Search

- **User Search**: Search by name or email
- **Message Search**: Search within message content
- **Real-time Results**: Updates as you type

### Mobile Responsiveness

- **Adaptive Layout**: Single pane on mobile, dual pane on desktop
- **Touch Optimized**: Large touch targets, swipe gestures
- **Safe Areas**: Respects iOS safe area insets

---

## Dependencies

### External Dependencies

```json
{
  "convex": "^1.31.3",
  "react": "^19.2.3",
  "next": "^16.1.0-canary.19",
  "dompurify": "^3.3.1",
  "marked": "^17.0.1"
}
```

### Internal Dependencies

The module depends on these application-specific modules:

- **`@/ctx/auth`**: Authentication context (`useAuthCtx`)
- **`@/hooks/use-mobile`**: Mobile detection hook
- **`@/hooks/use-image-converter`**: Image conversion utility
- **`@/components/ui/*`**: UI component library (Avatar, ScrollArea, Input)
- **`@/lib/icons`**: Icon component library
- **`@/lib/utils`**: Utility functions (`cn`)
- **`@/utils/date`**: Date formatting utilities
- **`@/utils/time`**: Time formatting utilities
- **`@/ctx/tone`**: Tone.js audio context (for sound effects)

### Convex Dependencies

- **`api.messages.q.*`**: Message queries
- **`api.messages.m.*`**: Message mutations
- **`api.assistant.q.*`**: Assistant queries
- **`api.assistant.m.*`**: Assistant mutations
- **`api.users.q.getByProId`**: User lookup
- **`api.userProfiles.q.getByProId`**: User profile lookup
- **`api.files.upload.url`**: File upload URL generation

### API Routes

- **`/api/ai/chat`**: AI assistant streaming endpoint (POST)

---

## Usage Guide

### Basic Setup

1. **Import the main component:**
```typescript
import { ChatContent } from '@/app/account/chat/content'
```

2. **Use in a page:**
```typescript
export default function ChatPage() {
  const { user } = useAuthCtx()
  
  if (!user?.uid) {
    return <div>Please sign in</div>
  }
  
  return <ChatContent />
}
```

### With Initial Conversation

```typescript
<ChatContent initialConversationId="user-pro-id-123" />
```

### Custom Styling

The module uses Tailwind CSS classes. You can override styles by:
1. Wrapping in a container with custom classes
2. Using CSS variables for theming
3. Modifying component classes directly

### Environment Variables

Required for AI assistant:
- `COHERE_API_KEY`: Cohere API key for chat streaming

---

## API Reference

### Component Props

#### `ChatContent`

```typescript
interface ChatContentProps {
  initialConversationId?: string  // Pre-select a conversation
}
```

#### `MessageList`

```typescript
interface MessageListProps {
  messages: Message[] | undefined
  currentUserProId: string
  otherUserProId: string
  onOptimisticLike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
  onOptimisticUnlike?: (messageId: Id<'messages'>, userId: Id<'users'>) => void
}
```

#### `MessageInput`

```typescript
interface MessageInputProps {
  receiverProId: string
  senderProId: string
  onMessageSent?: () => void
  onOptimisticMessage?: (
    content: string,
    attachments?: Attachment[]
  ) => void
}
```

### Type Definitions

#### `Message`

```typescript
interface Message {
  _id: Id<'messages'>
  senderId: Id<'users'>
  receiverId: Id<'users'>
  content: string
  createdAt: string
  readAt: string | null
  attachments?: Attachment[]
  likes?: Array<{
    userId: Id<'users'>
    likedAt: string
  }>
}
```

#### `Attachment`

```typescript
interface Attachment {
  storageId: Id<'_storage'>
  fileName: string
  fileType: string
  fileSize: number
  url: string | null
}
```

#### `AssistantMessage`

```typescript
interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
```

---

## Module Extraction Guide

To use this chat module in other applications, follow these steps:

### 1. Copy Files

Copy the entire `src/app/account/chat/` directory to your target application.

### 2. Update Imports

Replace all `@/` imports with your application's import alias:

```typescript
// Before
import { useAuthCtx } from '@/ctx/auth'

// After (example)
import { useAuthCtx } from '@/lib/auth'
```

### 3. Required Dependencies

Install these packages:
```bash
bun add convex react next dompurify marked
```

### 4. Convex Setup

Copy these Convex modules:
- `convex/messages/` (all files)
- `convex/assistant/` (all files)
- Update `convex/schema.ts` to include `messages` table

### 5. Required Contexts/Hooks

Implement or adapt:
- `useAuthCtx()`: Must return `{ user: { uid: string } }`
- `useMobile()`: Returns `boolean` for mobile detection
- `useImageConverter()`: Image conversion utility

### 6. UI Components

Ensure these UI components exist:
- `Avatar`, `AvatarFallback`, `AvatarImage`
- `ScrollArea`
- `Input` or `FlatInput`
- Icon component system

### 7. Convex Functions

Ensure these Convex functions exist:
- `api.users.q.getByProId`
- `api.userProfiles.q.getByProId`
- `api.files.upload.url`

### 8. API Route

Create `/api/ai/chat` route for AI assistant streaming.

### 9. Configuration

Update assistant constants in:
- `_components/assistant.ts`
- `convex/assistant/d.ts`

### 10. Styling

Ensure Tailwind CSS is configured with:
- Custom color variables (`primary`, `muted`, `foreground`, etc.)
- Custom utilities (`cn`, etc.)

### 11. Testing

Test the following:
- [ ] User-to-user messaging
- [ ] File attachments
- [ ] Audio messages
- [ ] AI assistant chat
- [ ] Read receipts
- [ ] Message reactions
- [ ] Search functionality
- [ ] Mobile responsiveness

### 12. Optional Features

You can remove or disable:
- AI Assistant (remove assistant-related components)
- Audio messages (remove `useAudioRecorder` and related UI)
- Sound effects (remove `use-chat-sfx.ts`)

---

## Troubleshooting

### Messages Not Updating

- Check Convex connection
- Verify user authentication
- Check Convex query subscriptions

### File Uploads Failing

- Verify Convex storage is configured
- Check file size limits (10MB)
- Ensure `api.files.upload.url` mutation exists

### AI Assistant Not Responding

- Check `/api/ai/chat` route exists
- Verify API key is set
- Check assistant user exists in database
- Verify `isPublic` flag is set

### Mobile Layout Issues

- Check `useMobile()` hook implementation
- Verify viewport meta tags
- Test safe area insets on iOS

---

## Performance Considerations

### Optimizations

1. **Message Grouping**: Messages are grouped by date to reduce re-renders
2. **Optimistic Updates**: Immediate UI feedback before server confirmation
3. **Lazy Loading**: Images and attachments load on demand
4. **Auto-scroll Throttling**: Prevents excessive scrolling calculations
5. **Memoization**: Hooks use `useMemo` for expensive calculations

### Best Practices

1. **Limit Message History**: Consider pagination for very long conversations
2. **Image Optimization**: Images are converted to WebP automatically
3. **File Size Limits**: Enforce 10MB limit on client and server
4. **Connection Checks**: Verify user connections before allowing messages

---

## Security Considerations

### Authentication

- All queries require authenticated user
- User IDs are validated on backend
- No direct database access from client

### Authorization

- Users can only message connected users (follows relationship)
- Only sender/receiver can delete messages
- Assistant bypasses connection requirement

### File Uploads

- File type validation (images, PDFs, audio only)
- File size limits enforced
- SVG files rejected (security)
- Images converted to WebP (sanitization)

### Content Sanitization

- Assistant markdown is sanitized with DOMPurify
- User messages are plain text (no HTML)

---

## Future Enhancements

Potential improvements:

1. **Message Editing**: Edit sent messages
2. **Message Threading**: Reply to specific messages
3. **Typing Indicators**: Show when user is typing
4. **Presence Status**: Online/offline indicators
5. **Message Reactions**: More reaction types beyond likes
6. **Voice/Video Calls**: Integration with WebRTC
7. **End-to-End Encryption**: Encrypted message content
8. **Message Search**: Full-text search across all messages
9. **Export Conversations**: Download conversation history
10. **Message Scheduling**: Schedule messages for later

---

## License

This module is part of the Protap application. Refer to the main project license.

---

## Support

For issues or questions:
1. Check this documentation
2. Review Convex logs
3. Check browser console for errors
4. Verify all dependencies are installed

---

**Last Updated**: 2025-01-27
**Version**: 1.0.0
