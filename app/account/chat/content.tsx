'use client'

import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Avatar, User} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
} from 'react'
import {
  ASSISTANT_NAME,
  ASSISTANT_PRO_ID,
  isAssistantConversation,
} from './_components/assistant'
import {AssistantMessageInput} from './_components/assistant-message-input'
import {AssistantMessageList} from './_components/assistant-message-list'
import {Conversation, ConversationList} from './_components/conversation-list'
import {ConversationSearch} from './_components/conversation-search'
import {MessageInput} from './_components/message-input'
import {MessageList} from './_components/message-list'
import {useAssistantChat} from './_components/use-assistant-chat'

interface ChatContentProps {
  initialConversationId?: string
}

export function ChatContent({initialConversationId}: ChatContentProps) {
  const {user} = useAuthCtx()
  const router = useRouter()
  const isMobile = useMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true) // Track if we should auto-scroll
  const previousMessagesLengthRef = useRef(0)

  // Derive conversation state from URL
  const selectedUserProId = initialConversationId ?? null
  const isAssistant = isAssistantConversation(selectedUserProId)
  const showChat = !!selectedUserProId // For mobile: show chat area if conversation selected

  // Assistant chat hook
  const assistantChat = useAssistantChat()
  const [assistantDraft, setAssistantDraft] = useState('')

  // Get assistant user and last message for preview
  const assistantUser = useQuery(api.assistant.q.getAssistantUser)
  const lastAssistantMessage = useQuery(
    api.assistant.q.getLastAssistantMessage,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  const sendAssistantQuickAction = useCallback(
    async (suggestion: string) => {
      if (assistantChat.isLoading) return

      startTransition(() => {
        setAssistantDraft(suggestion)
      })

      await assistantChat.sendMessage(suggestion)

      startTransition(() => {
        setAssistantDraft('')
      })

      shouldAutoScrollRef.current = true
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
      }, 100)
    },
    [assistantChat, shouldAutoScrollRef],
  )

  // Real-time conversations - automatically updates via Convex reactivity
  const conversations = useQuery(api.messages.q.getConversations, {
    fid: user?.uid ?? '',
  })

  // Search conversations
  const searchResults = useQuery(
    api.messages.q.searchConversations,
    searchQuery.trim() && user?.uid
      ? {
          fid: user.uid,
          searchQuery: searchQuery.trim(),
        }
      : 'skip',
  )

  // Use search results if searching, otherwise use regular conversations
  const displayedConversations = useMemo(() => {
    const raw =
      searchQuery.trim() && searchResults
        ? searchResults
        : (conversations ?? [])
    return raw.filter(
      (c): c is Conversation => c != null && c.lastMessage != null,
    )
  }, [searchQuery, searchResults, conversations])

  // Auto-scroll for assistant messages
  const previousAssistantMessagesLengthRef = useRef(0)
  useEffect(() => {
    if (!isAssistant || assistantChat.messages.length === 0) return

    const currentLength = assistantChat.messages.length
    const previousLength = previousAssistantMessagesLengthRef.current

    if (previousLength === 0 || currentLength > previousLength) {
      if (shouldAutoScrollRef.current || previousLength === 0) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
        }, 100)
      }
    }

    previousAssistantMessagesLengthRef.current = currentLength
  }, [assistantChat.messages, isAssistant])

  // Real-time messages - automatically updates when new messages arrive
  const messagesQuery = useQuery(
    api.messages.q.getMessages,
    selectedUserProId && user?.uid
      ? {
          currentUserId: user.uid,
          otherUserId: selectedUserProId,
        }
      : 'skip',
  )

  // Get current user's Convex ID for optimistic updates
  const currentUserConvex = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  // Get other user's Convex ID for optimistic updates
  const otherUser = useQuery(
    api.users.q.getCurrentUser,
    selectedUserProId ? {fid: selectedUserProId} : 'skip',
  )

  // Optimistic updates reducer
  type OptimisticAction =
    | {
        type: 'add-message'
        content: string
        attachments?: Array<{
          storageId: Id<'_storage'>
          fileName: string
          fileType: string
          fileSize: number
          url: string | null
        }>
      }
    | {
        type: 'like-message'
        messageId: Id<'messages'>
        userId: Id<'users'>
      }
    | {
        type: 'unlike-message'
        messageId: Id<'messages'>
        userId: Id<'users'>
      }

  const [optimisticMessages, addOptimisticUpdate] = useOptimistic(
    messagesQuery ?? [],
    (
      state: typeof messagesQuery,
      action: OptimisticAction,
    ): typeof messagesQuery => {
      if (!state) return state

      switch (action.type) {
        case 'add-message': {
          if (!currentUserConvex || !otherUser) return state

          const optimisticMessage: (typeof state)[number] = {
            _id: `optimistic-${Date.now()}` as Id<'messages'>,
            _creationTime: Date.now(),
            senderId: currentUserConvex._id,
            receiverId: otherUser._id,
            content: action.content,
            createdAt: new Date().toISOString(),
            readAt: null,
            visible: true,
            attachments: action.attachments,
            likes: [],
          }

          return [...state, optimisticMessage]
        }

        case 'like-message': {
          return state.map((msg) => {
            if (msg._id !== action.messageId) return msg

            const existingLikes = msg.likes ?? []
            const alreadyLiked = existingLikes.some(
              (like) => like.userId === action.userId,
            )

            if (alreadyLiked) return msg

            return {
              ...msg,
              likes: [
                ...existingLikes,
                {
                  userId: action.userId,
                  likedAt: new Date().toISOString(),
                },
              ],
            }
          })
        }

        case 'unlike-message': {
          return state.map((msg) => {
            if (msg._id !== action.messageId) return msg

            const existingLikes = msg.likes ?? []
            return {
              ...msg,
              likes: existingLikes.filter(
                (like) => like.userId !== action.userId,
              ),
            }
          })
        }

        default:
          return state
      }
    },
  )

  // Only use optimistic messages when the query has resolved
  // This allows MessageList to show a loader while messagesQuery is undefined
  const messages = messagesQuery === undefined ? undefined : optimisticMessages

  const markAsRead = useMutation(api.messages.m.markAsRead)
  const archiveConversation = useMutation(api.messages.m.archiveConversation)

  // Get the other user's profile to fetch their username
  // const otherUserProfile = useQuery(
  //   api.userProfiles.q.getByProId,
  //   selectedUserProId ? {proId: selectedUserProId} : 'skip',
  // )

  // Check if user is near bottom of scroll area
  const isNearBottom = () => {
    if (!scrollAreaRef.current) return true
    const viewport = scrollAreaRef.current.querySelector(
      '[data-slot="scroll-area-viewport"]',
    )
    if (!viewport) return true

    const {scrollTop, scrollHeight, clientHeight} = viewport
    const threshold = 100 // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  // Auto-scroll to bottom only when:
  // 1. New messages arrive and user is already near bottom
  // 2. User sends a new message
  // 3. Conversation is first opened
  useEffect(() => {
    if (!messages || messages.length === 0) return

    const currentLength = messages.length
    const previousLength = previousMessagesLengthRef.current

    // If conversation just opened or user sent a message (length increased)
    if (previousLength === 0 || currentLength > previousLength) {
      // Only auto-scroll if user is near bottom or it's a new conversation
      if (shouldAutoScrollRef.current || previousLength === 0) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
        }, 100)
      }
    }

    previousMessagesLengthRef.current = currentLength
  }, [messages])

  // Track scroll position to determine if we should auto-scroll
  useEffect(() => {
    if (!scrollAreaRef.current) return

    const viewport = scrollAreaRef.current.querySelector(
      '[data-slot="scroll-area-viewport"]',
    )
    if (!viewport) return

    const handleScroll = () => {
      shouldAutoScrollRef.current = isNearBottom()
    }

    viewport.addEventListener('scroll', handleScroll, {passive: true})
    return () => viewport.removeEventListener('scroll', handleScroll)
  }, [selectedUserProId]) // Re-setup when conversation changes

  // Get the ID of the last message to detect new incoming messages
  const lastMessageId = messages?.[messages.length - 1]?._id

  // Mark messages as read when conversation is selected or new messages arrive
  useEffect(() => {
    if (selectedUserProId && user?.uid && !isAssistant) {
      markAsRead({
        senderfid: selectedUserProId,
        receiverfid: user.uid,
      }).catch(console.error)
    }
  }, [selectedUserProId, user?.uid, markAsRead, lastMessageId, isAssistant])

  const handleSelectConversation = (
    _otherUserId: string,
    otherUserProId: string,
  ) => {
    setSearchQuery('') // Clear search when selecting a conversation
    shouldAutoScrollRef.current = true // Reset auto-scroll for new conversation
    previousMessagesLengthRef.current = 0 // Reset message count
    previousAssistantMessagesLengthRef.current = 0 // Reset assistant message count
    router.push(`/account/chat/${otherUserProId}`)
  }

  const handleSelectAssistant = () => {
    setSearchQuery('')
    shouldAutoScrollRef.current = true
    previousAssistantMessagesLengthRef.current = 0
    router.push(`/account/chat/${ASSISTANT_PRO_ID}`)
  }

  const handleBackToConversations = () => {
    router.push('/account/chat')
  }

  const handleArchiveConversation = useCallback(
    async (otherUserId: string, otherUserProId: string) => {
      if (!user?.uid) return
      try {
        await archiveConversation({
          userfid: user.uid,
          otherUserfid: otherUserProId,
          otherUserId,
        })
        if (selectedUserProId === otherUserProId) {
          router.push('/account/chat')
        }
      } catch (error) {
        console.error('Error archiving conversation:', error)
      }
    },
    [user, archiveConversation, selectedUserProId, router],
  )

  // Find selected conversation by fid (null when conversation is archived)
  const selectedConversation = displayedConversations?.find(
    (conv) => conv?.otherUser?.fid === selectedUserProId,
  )

  // For archived conversations we have selectedUserProId but no selectedConversation; use profile for header when available
  const chatDisplayUser =
    selectedConversation?.otherUser ??
    (selectedUserProId && otherUser
      ? {
          fid: selectedUserProId,
          name: otherUser.name ?? null,
          email: otherUser.email ?? '',
          photoUrl: otherUser.photoUrl ?? null,
          proId: selectedUserProId,
          displayName: otherUser.name ?? null,
          avatarUrl: otherUser.photoUrl ?? null,
        }
      : null)

  // On mobile, show either list or chat. On desktop, show both
  const showConversationList = !isMobile || !showChat
  const showChatArea = !isMobile || showChat

  return (
    <div className='flex h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] w-full bg-sidebar/20 overflow-hidden rounded-xs'>
      {/* Conversation List Sidebar */}
      <div
        className={cn(
          'backdrop-blur-sm lg:border-l flex flex-col transition-all duration-300',
          isMobile
            ? showConversationList
              ? 'w-full'
              : 'hidden'
            : 'w-90 shrink-0',
        )}>
        {/* Search Input */}
        <ConversationSearch
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
        />

        {/* Conversation List */}
        <ScrollArea className='flex-1'>
          {/* Assistant conversation - always first */}
          {!searchQuery.trim() && (
            <div className='border-b border-border/40'>
              <button
                onClick={handleSelectAssistant}
                className={cn(
                  'w-full px-3 md:px-4 py-3 text-left transition-all duration-200 active:bg-accent/70',
                  'hover:bg-sidebar touch-manipulation',
                  isAssistant &&
                    'bg-sidebar border-l-2 md:border-l-2 border-l-blue-500',
                )}>
                <div className='flex items-start gap-2 md:gap-3'>
                  <div className='relative shrink-0'>
                    <User
                      avatarProps={{
                        src: '/svg/rf-logo-round-204-latest.svg',
                        fallback: 'FG',
                      }}
                      name={undefined}
                    />
                    <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-background' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-2 mb-1'>
                      <p className='truncate text-sm text-foreground flex items-center gap-1.5'>
                        <span className='font-okxs font-medium'>
                          {assistantUser?.name ?? ASSISTANT_NAME}
                        </span>
                        <span className='text-[10px] px-1.5 py-0.5 rounded-sm bg-sidebar text-brand dark:text-sky-50 font-polysans font-semibold'>
                          AI
                        </span>
                      </p>
                    </div>
                    <p className='truncate max-w-[200px] text-sm text-muted-foreground'>
                      {lastAssistantMessage
                        ? lastAssistantMessage.content.slice(0, 50) +
                          (lastAssistantMessage.content.length > 50
                            ? '...'
                            : '')
                        : 'ask me anything'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          <ConversationList
            selectedProId={selectedUserProId}
            conversations={displayedConversations}
            onSelectConversation={handleSelectConversation}
            onArchiveConversation={handleArchiveConversation}
          />
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex flex-1 flex-col bg-background transition-all duration-300 border-t lg:border-x border-sidebar',
          isMobile && !showChatArea && 'hidden',
        )}>
        {isAssistant ? (
          <>
            {/* Assistant Chat Header */}
            <div className='sticky top-0 z-10 h-14 md:h-16 flex items-center justify-between px-3 md:px-4 backdrop-blur-md shrink-0 border-b border-border/40'>
              <div className='flex items-center gap-0 md:gap-3 flex-1 min-w-0'>
                {isMobile && (
                  <button
                    onClick={handleBackToConversations}
                    className='p-2 -ml-2 rounded-full hover:bg-sidebar transition-colors shrink-0 active:scale-95'>
                    <Icon
                      name='chevron-left'
                      className='size-4 text-foreground'
                    />
                  </button>
                )}
                <div className='relative shrink-0'>
                  <User
                    avatarProps={{
                      src: '/svg/rf-logo-round-204-latest.svg',
                    }}
                    name={undefined}
                  />
                  <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-card' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h2 className='font-semibold text-sm truncate flex items-center gap-1.5'>
                    <span className='font-okxs font-medium'>
                      {assistantUser?.name ?? ASSISTANT_NAME}
                    </span>
                    <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-sidebar text-brand dark:text-sky-50 font-polysans font-semibold'>
                      AI
                    </span>
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    {assistantChat.isLoading ? 'Typing...' : 'Always available'}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-1 md:gap-2 shrink-0'>
                {assistantChat.messages.length > 0 && (
                  <button
                    onClick={assistantChat.clearMessages}
                    className='p-2 rounded-full hover:bg-accent transition-colors active:scale-95'
                    title='Clear conversation'>
                    <Icon name='x' className='size-5 text-muted-foreground' />
                  </button>
                )}
              </div>
            </div>

            {/* Assistant Messages Area */}
            <ScrollArea ref={scrollAreaRef} className='flex-1 min-h-0'>
              <div className='px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-32'>
                <AssistantMessageList
                  messages={assistantChat.messages}
                  isLoading={assistantChat.isLoading}
                  onQuickAction={sendAssistantQuickAction}
                />
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Assistant Message Input */}
            <div
              className='border-t border-border/40 backdrop-blur-sm p-3 md:p-4 shrink-0'
              style={{
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}>
              <AssistantMessageInput
                onSendMessage={assistantChat.sendMessage}
                isLoading={assistantChat.isLoading}
                value={assistantDraft}
                onValueChange={setAssistantDraft}
                onMessageSent={() => {
                  shouldAutoScrollRef.current = true
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
                  }, 100)
                }}
              />
            </div>
          </>
        ) : selectedUserProId && chatDisplayUser ? (
          <>
            {/* Chat Header - Sticky (works for both listed and archived conversations) */}
            <div className='sticky top-0 z-10 h-14 md:h-16 flex items-center justify-between px-3 md:px-4 backdrop-blur-md shrink-0'>
              <div className='flex items-center gap-0 md:gap-3 flex-1 min-w-0'>
                {/* Back button on mobile */}
                {isMobile && (
                  <button
                    onClick={handleBackToConversations}
                    className='p-2 -ml-2 rounded-full hover:bg-accent transition-colors shrink-0 active:scale-95'>
                    <Icon
                      name='chevron-left'
                      className='size-4 text-foreground'
                    />
                  </button>
                )}
                <div className='relative shrink-0'>
                  {otherUser?.name ? (
                    <Link href={`/u/${otherUser.name}`}>
                      <Avatar src={currentUserConvex?.photoUrl ?? undefined} />
                    </Link>
                  ) : (
                    <Avatar src={otherUser?.photoUrl ?? undefined} />
                  )}
                  <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-card' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h2 className='font-semibold text-sm truncate'>
                    {chatDisplayUser.displayName ??
                      chatDisplayUser.name ??
                      chatDisplayUser.email?.split('@')[0] ??
                      'Unknown User'}
                  </h2>
                  <p className='text-xs'>Active now</p>
                </div>
              </div>
              <div className='flex items-center gap-1 md:gap-2 shrink-0'>
                <button className='p-2 rounded-full hover:bg-accent transition-colors active:scale-95'>
                  <Icon name='phone' className='size-5 opacity-20' />
                </button>
                {!isMobile && (
                  <button className='hidden p-2 rounded-full hover:bg-accent transition-colors active:scale-95'>
                    <Icon name='user' className='size-5' />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className='flex-1 min-h-0'>
              <div className='px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-32'>
                <MessageList
                  messages={messages}
                  currentUserProId={user?.uid ?? ''}
                  otherUserProId={selectedUserProId ?? ''}
                  onOptimisticLike={(messageId, userId) => {
                    startTransition(() => {
                      addOptimisticUpdate({
                        type: 'like-message',
                        messageId,
                        userId,
                      })
                    })
                  }}
                  onOptimisticUnlike={(messageId, userId) => {
                    startTransition(() => {
                      addOptimisticUpdate({
                        type: 'unlike-message',
                        messageId,
                        userId,
                      })
                    })
                  }}
                />
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div
              className='border-t border-border/40 backdrop-blur-sm p-3 md:p-4 shrink-0'
              style={{
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}>
              <MessageInput
                receiverProId={selectedUserProId ?? ''}
                senderProId={user?.uid ?? ''}
                onOptimisticMessage={(content, attachments) => {
                  startTransition(() => {
                    addOptimisticUpdate({
                      type: 'add-message',
                      content,
                      attachments,
                    })
                  })
                }}
                onMessageSent={() => {
                  // Force auto-scroll when user sends a message
                  shouldAutoScrollRef.current = true
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
                  }, 100)
                }}
              />
            </div>
          </>
        ) : (
          <div className='flex h-full items-center justify-center bg-linear-to-br from-background to-muted/20'>
            <div className='text-center space-y-4 px-4'>
              <div className='flex justify-center'>
                <div className='size-16 md:size-20 rounded-full bg-linear-to-br from-sidebar/20 to-sidebar/60 flex items-center justify-center border border-sidebar/20'>
                  <Icon
                    name='chat'
                    className='size-8 md:size-10 text-dark-table'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <h3 className='text-base md:text-lg font-polysans font-semibold'>
                  Select a conversation
                </h3>
                <p className='text-xs md:text-sm text-muted-foreground max-w-sm mx-auto'>
                  {isMobile
                    ? 'Choose a conversation to start messaging'
                    : 'Choose a conversation from the sidebar to start messaging'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
