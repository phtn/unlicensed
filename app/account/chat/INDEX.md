# Chat Module Documentation Index

Welcome to the Chat Module documentation. This module provides a complete real-time messaging system with AI assistant capabilities.

## Documentation Files

### 📘 [README.md](./README.md)
**Complete module documentation**
- Overview and architecture
- Component reference
- Hook documentation
- Convex backend API
- Features and capabilities
- Usage guide
- API reference

**Start here for:** Full understanding of the module

### 🏗️ [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md)
**Quick reference guide**
- Component hierarchy
- Data flow diagrams
- File organization
- Import dependencies
- Performance metrics
- Testing checklist

**Start here for:** Quick lookup and structure understanding

### 🔧 [EXTRACTION_GUIDE.md](./EXTRACTION_GUIDE.md)
**Step-by-step extraction guide**
- Copy instructions
- Import updates
- Dependency setup
- Customization options
- Migration notes
- Troubleshooting

**Start here for:** Extracting module to another application

## Quick Start

### For Users

1. Import `ChatContent` component
2. Wrap with authentication check
3. Use in your page

```typescript
import { ChatContent } from './content'

export default function ChatPage() {
  const { user } = useAuthCtx()
  if (!user?.uid) return <div>Sign in required</div>
  return <ChatContent />
}
```

### For Developers

1. Read [README.md](./README.md) for architecture
2. Review [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) for structure
3. Check [EXTRACTION_GUIDE.md](./EXTRACTION_GUIDE.md) for extraction

## Key Features

✅ **Real-time messaging** - Convex reactivity  
✅ **AI Assistant** - Streaming responses with markdown  
✅ **File attachments** - Images, PDFs, audio  
✅ **Voice messages** - Record and send audio  
✅ **Message reactions** - Like messages  
✅ **Read receipts** - See when messages are read  
✅ **Search** - Find conversations and messages  
✅ **Mobile responsive** - Adaptive layouts  

## Architecture Overview

```
Frontend (React/Next.js)
    ↓
Hooks (Business Logic)
    ↓
Convex Backend (Real-time Database)
    ↓
Convex Storage (File Storage)
```

## Module Statistics

- **Total Files**: 20+ components and utilities
- **Lines of Code**: ~3,500+ lines
- **Convex Functions**: 15+ queries and mutations
- **Components**: 15+ React components
- **Hooks**: 5+ custom hooks

## Dependencies

### Core
- Next.js 16+
- React 19+
- Convex 1.31+
- TypeScript

### UI
- Tailwind CSS
- Radix UI components
- Custom icon system

### Utilities
- DOMPurify (sanitization)
- Marked (markdown parsing)
- Tone.js (sound effects)

## Convex Tables

### `messages`
Stores all messages between users with:
- Content and metadata
- Attachments (files)
- Likes (reactions)
- Read receipts

### Indexes
- `by_sender` - Messages sent by user
- `by_receiver` - Messages received by user
- `by_sender_receiver` - Messages between two users
- `by_receiver_sender` - Reverse lookup

## Common Tasks

### Send a Message
```typescript
const sendMessage = useMutation(api.messages.m.sendMessage)
await sendMessage({
  receiverProId: "user-id",
  senderProId: "current-user-id",
  content: "Hello!",
})
```

### Get Conversations
```typescript
const conversations = useQuery(api.messages.q.getConversations, {
  userProId: user.uid,
})
```

### Get Messages
```typescript
const messages = useQuery(api.messages.q.getMessages, {
  currentUserProId: user.uid,
  otherUserProId: "other-user-id",
})
```

## File Organization

```
chat/
├── README.md              # Main documentation
├── MODULE_STRUCTURE.md    # Structure reference
├── EXTRACTION_GUIDE.md    # Extraction guide
├── INDEX.md              # This file
├── page.tsx              # Main page
├── content.tsx           # Main component
├── [id]/
│   └── page.tsx         # Conversation page
└── _components/          # All components
    ├── assistant.ts
    ├── message-*.tsx
    ├── conversation-*.tsx
    └── use-*.ts
```

## Support & Resources

### Documentation
- [README.md](./README.md) - Complete guide
- [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) - Structure reference
- [EXTRACTION_GUIDE.md](./EXTRACTION_GUIDE.md) - Extraction steps

### Related Files
- `convex/messages/` - Backend queries/mutations
- `convex/assistant/` - AI assistant backend
- `convex/schema.ts` - Database schema

### External Resources
- [Convex Documentation](https://docs.convex.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)

## Version History

- **v1.0.0** (2025-01-27)
  - Initial documentation
  - Complete module structure
  - Extraction guide

## Contributing

When updating the module:

1. Update relevant documentation
2. Update version in README.md
3. Test all features
4. Update this index if structure changes

## License

Part of the Protap application. Refer to main project license.

---

**Need Help?** Start with [README.md](./README.md) for comprehensive documentation.
