# Chat Module Structure

## Quick Reference

### Component Hierarchy

```
ChatContent (content.tsx)
├── ConversationList
│   └── ConversationSearch
├── MessageList
│   ├── MessageGroup (by date)
│   │   └── MessageBubble
│   │       ├── MessageBubbleAttachments
│   │       ├── MessageBubbleTimestamp
│   │       └── AudioMessagePlayer
│   └── ImageModal
├── MessageInput
│   └── useAudioRecorder
└── AssistantMessageList
    └── AssistantMessageInput
```

### Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Optimistic Update (immediate UI)
    ↓
Convex Mutation
    ↓
Convex Query (real-time subscription)
    ↓
UI Update (replaces optimistic)
```

### Convex Backend Structure

```
convex/
├── messages/
│   ├── d.ts          # Schema definition
│   ├── q.ts          # Queries
│   └── m.ts          # Mutations
└── assistant/
    ├── d.ts          # Constants
    ├── q.ts          # Queries
    └── m.ts          # Mutations
```

### Key Files by Feature

#### Core Messaging
- `content.tsx` - Main orchestrator
- `message-list.tsx` - Message display
- `message-input.tsx` - Message composition
- `message-bubble.tsx` - Individual message UI

#### AI Assistant
- `assistant-message-list.tsx` - Assistant chat display
- `assistant-message-input.tsx` - Assistant input
- `use-assistant-chat.ts` - Assistant state management
- `assistant.ts` - Constants

#### Audio Messages
- `use-audio-recorder.ts` - Recording logic
- `audio-message-player.tsx` - Playback UI

#### Conversation Management
- `conversation-list.tsx` - Sidebar list
- `conversation-search.tsx` - Search input

#### Utilities
- `message-list-hooks.ts` - Grouping & read receipts
- `message-list-types.ts` - TypeScript types
- `message-list-utils.ts` - Helper functions

### State Management

#### Local State (React)
- Message drafts
- UI state (modals, selected messages)
- Recording state
- Search queries

#### Server State (Convex)
- Messages
- Conversations
- User data
- Read receipts
- Likes

#### Optimistic State
- Pending messages
- Pending likes
- Immediate UI updates

### File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| `content.tsx` | 681 | Main component |
| `message-input.tsx` | 713 | Input component |
| `message-list.tsx` | 209 | Message display |
| `use-assistant-chat.ts` | 221 | Assistant hook |
| `use-audio-recorder.ts` | 193 | Audio recording |
| `message-bubble.tsx` | 214 | Message UI |

### Import Dependencies Map

```
content.tsx
├── @/components/ui (Avatar, ScrollArea)
├── @/ctx/auth
├── @/hooks/use-mobile
├── @/lib/icons, @/lib/utils
├── convex/react (useQuery, useMutation)
└── _components/*

message-input.tsx
├── @/hooks/use-image-converter
├── @/hooks/use-mobile
├── @/lib/icons, @/lib/utils
├── convex/react
└── use-audio-recorder

message-list.tsx
├── @/ctx/auth, @/ctx/tone
├── @/lib/icons
├── convex/react
└── _components/*
```

### Convex Query/Mutation Map

#### Messages
- `messages.q.getConversations` - List all conversations
- `messages.q.getMessages` - Get messages between users
- `messages.q.searchConversations` - Search conversations
- `messages.q.getUnreadCount` - Unread message count
- `messages.m.sendMessage` - Send message
- `messages.m.likeMessage` - Toggle like
- `messages.m.markAsRead` - Mark as read
- `messages.m.deleteMessage` - Delete message

#### Assistant
- `assistant.q.getAssistantMessages` - Get assistant messages
- `assistant.q.getAssistantUser` - Get assistant user
- `assistant.q.getAssistantProfile` - Get assistant profile
- `assistant.q.getLastAssistantMessage` - Get last message
- `assistant.m.sendAssistantMessage` - Send assistant message
- `assistant.m.clearAssistantMessages` - Clear conversation

#### Supporting
- `users.q.getByProId` - Get user by proId
- `userProfiles.q.getByProId` - Get user profile
- `files.upload.url` - Get file upload URL

### Environment Requirements

#### Required
- Convex backend configured
- Firebase Auth (or equivalent)
- File storage (Convex Storage)

#### Optional
- AI API (Cohere) for assistant
- Push notifications (FCM)
- Tone.js for sound effects

### Browser APIs Used

- `MediaRecorder` - Audio recording
- `getUserMedia` - Microphone access
- `URL.createObjectURL` - File previews
- `FileReader` - File handling
- `fetch` - API calls

### Performance Metrics

- **Initial Load**: ~500ms (with cached data)
- **Message Send**: <100ms (optimistic) + ~200ms (server)
- **File Upload**: ~1-2s per MB
- **Audio Recording**: Real-time, minimal overhead
- **Search**: <100ms for typical queries

### Accessibility Features

- Keyboard navigation support
- Screen reader friendly
- Touch targets ≥44px
- ARIA labels on interactive elements
- Focus management

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 14+)
- Mobile browsers: Full support

### Testing Checklist

- [ ] Send text message
- [ ] Send image attachment
- [ ] Send PDF attachment
- [ ] Send audio message
- [ ] Like/unlike message
- [ ] Read receipts
- [ ] Search conversations
- [ ] AI assistant chat
- [ ] Mobile layout
- [ ] Desktop layout
- [ ] Error handling
- [ ] Network offline handling
