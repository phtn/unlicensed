'use client'

import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {ScrollArea} from '@/components/ui/scroll-area'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import type {ConversationFolderSummary} from '@/convex/messages/d'
import {useAuthCtx} from '@/ctx/auth'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Avatar} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import type {FunctionReturnType} from 'convex/server'
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
import {
  ALL_CONVERSATIONS_FOLDER,
  ConversationFolderToolbar,
  UNFILED_CONVERSATIONS_FOLDER,
} from './_components/conversation-folder-toolbar'
import type {Conversation} from './_components/conversation-list'
import {ConversationList} from './_components/conversation-list'
import {ConversationSearch} from './_components/conversation-search'
import {MessageInput} from './_components/message-input'
import {MessageList} from './_components/message-list'
import {useAssistantChat} from './_components/use-assistant-chat'

interface ChatContentProps {
  initialConversationId?: string
}

type ConversationMessage = FunctionReturnType<
  typeof api.messages.q.getMessages
>[number]
type ConversationMessageLike = NonNullable<ConversationMessage['likes']>[number]

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const ChatAvatar = ({
  src,
  label,
  className,
  fallback,
}: {
  src?: string | null
  label: string
  className?: string
  fallback?: string
}) => (
  <Avatar className={className}>
    {src ? <HeroAvatarImage alt={label} src={src} /> : null}
    <Avatar.Fallback>{fallback ?? getInitials(label)}</Avatar.Fallback>
  </Avatar>
)

export function ChatContent({initialConversationId}: ChatContentProps) {
  const {user, convexUserId} = useAuthCtx()
  const currentUserId = user?.uid ?? null
  const router = useRouter()
  const isMobile = useMobile()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFolderId, setActiveFolderId] = useState(ALL_CONVERSATIONS_FOLDER)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [scrollButtonAnchorEl, setScrollButtonAnchorEl] =
    useState<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(true) // Track if we should auto-scroll
  const previousMessagesLengthRef = useRef(0)

  // Derive conversation state from URL
  const selectedConversationRef = initialConversationId ?? null
  const isAssistant = isAssistantConversation(selectedConversationRef)
  const showChat = !!selectedConversationRef // For mobile: show chat area if conversation selected

  // Assistant chat hook
  const assistantChat = useAssistantChat()
  const [assistantDraft, setAssistantDraft] = useState('')

  // Get assistant user and last message for preview
  const assistantUser = useQuery(api.assistant.q.getAssistantUser)
  const lastAssistantMessage = useQuery(
    api.assistant.q.getLastAssistantMessage,
    currentUserId ? {fid: currentUserId} : 'skip',
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
  const conversations = useQuery(
    api.messages.q.getConversations,
    currentUserId ? {fid: currentUserId} : 'skip',
  )

  // Search conversations
  const searchResults = useQuery(
    api.messages.q.searchConversations,
    searchQuery.trim() && currentUserId
      ? {
          fid: currentUserId,
          searchQuery: searchQuery.trim(),
        }
      : 'skip',
  )
  const conversationFolderState = useQuery(
    api.messages.q.getConversationFolders,
    currentUserId ? {fid: currentUserId} : 'skip',
  )
  const selectedConversationUser = useQuery(
    api.messages.q.resolveParticipantReference,
    selectedConversationRef && !isAssistant
      ? {reference: selectedConversationRef}
      : 'skip',
  )
  const selectedConversationFid = useMemo(() => {
    if (!selectedConversationUser) {
      return null
    }

    if ('guestId' in selectedConversationUser) {
      return selectedConversationUser.fid
    }

    return (
      selectedConversationUser.fid ??
      selectedConversationUser.firebaseId ??
      null
    )
  }, [selectedConversationUser])

  // Use search results if searching, otherwise use regular conversations
  const baseConversations = useMemo<Conversation[]>(() => {
    const raw =
      searchQuery.trim() && searchResults
        ? searchResults
        : (conversations ?? [])

    const normalizedConversations: Conversation[] = []

    for (const conversation of raw) {
      if (!conversation || !conversation.lastMessage) {
        continue
      }

      normalizedConversations.push({
        otherUserId: conversation.otherUserId,
        otherUser: conversation.otherUser,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount,
        hasMessages: conversation.hasMessages,
        folderId: conversation.folderId ? String(conversation.folderId) : null,
        folderName: conversation.folderName ?? null,
      })
    }

    return normalizedConversations
  }, [searchQuery, searchResults, conversations])
  const folderOptions = useMemo<ConversationFolderSummary[]>(
    () => conversationFolderState?.folders ?? [],
    [conversationFolderState],
  )
  const folderingEnabled = conversationFolderState?.enabled === true
  const activeFolderExists = useMemo(
    () => folderOptions.some((folder) => String(folder._id) === activeFolderId),
    [activeFolderId, folderOptions],
  )
  const effectiveActiveFolderId =
    !folderingEnabled ||
    activeFolderId === ALL_CONVERSATIONS_FOLDER ||
    activeFolderId === UNFILED_CONVERSATIONS_FOLDER ||
    activeFolderExists
      ? activeFolderId
      : ALL_CONVERSATIONS_FOLDER

  const folderCounts = useMemo(() => {
    const counts = {
      all: (conversations ?? []).length,
      unfiled: 0,
      byFolderId: {} as Record<string, number>,
    }

    for (const conversation of conversations ?? []) {
      const folderId = conversation?.folderId
      if (!folderId) {
        counts.unfiled += 1
        continue
      }

      counts.byFolderId[String(folderId)] =
        (counts.byFolderId[String(folderId)] ?? 0) + 1
    }

    return counts
  }, [conversations])

  const displayedConversations = useMemo(() => {
    if (
      !folderingEnabled ||
      effectiveActiveFolderId === ALL_CONVERSATIONS_FOLDER
    ) {
      return baseConversations
    }

    if (effectiveActiveFolderId === UNFILED_CONVERSATIONS_FOLDER) {
      return baseConversations.filter((conversation) => !conversation.folderId)
    }

    return baseConversations.filter(
      (conversation) =>
        String(conversation.folderId ?? '') === effectiveActiveFolderId,
    )
  }, [baseConversations, effectiveActiveFolderId, folderingEnabled])

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
    currentUserId && selectedConversationFid
      ? {
          currentUserId,
          otherUserId: selectedConversationFid,
        }
      : 'skip',
  )

  // Get other user's Convex ID for optimistic updates
  const otherUser = selectedConversationUser

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
        userId: Id<'users'> | Id<'guests'>
      }
    | {
        type: 'unlike-message'
        messageId: Id<'messages'>
        userId: Id<'users'> | Id<'guests'>
      }

  const [optimisticMessages, addOptimisticUpdate] = useOptimistic(
    messagesQuery ?? [],
    (state: ConversationMessage[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add-message': {
          if (!convexUserId || !otherUser) return state

          const optimisticMessage: ConversationMessage = {
            _id: `optimistic-${Date.now()}` as Id<'messages'>,
            _creationTime: Date.now(),
            senderId: convexUserId,
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
              (like: ConversationMessageLike) => like.userId === action.userId,
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
                (like: ConversationMessageLike) =>
                  like.userId !== action.userId,
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
  const createConversationFolder = useMutation(
    api.messages.m.createConversationFolder,
  )
  const renameConversationFolder = useMutation(
    api.messages.m.renameConversationFolder,
  )
  const setConversationFolder = useMutation(
    api.messages.m.setConversationFolder,
  )

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
  }, [selectedConversationRef]) // Re-setup when conversation changes

  // Get the ID of the last message to detect new incoming messages
  const lastMessageId = messages?.[messages.length - 1]?._id

  // Mark messages as read when conversation is selected or new messages arrive
  useEffect(() => {
    if (
      selectedConversationFid &&
      currentUserId &&
      convexUserId &&
      otherUser?._id &&
      !isAssistant
    ) {
      markAsRead({
        senderfid: selectedConversationFid,
        receiverfid: currentUserId,
      }).catch(console.error)
    }
  }, [
    convexUserId,
    currentUserId,
    isAssistant,
    lastMessageId,
    markAsRead,
    otherUser?._id,
    selectedConversationFid,
  ])

  const handleSelectConversation = (
    otherUserId: string,
    _otherUserProId: string,
  ) => {
    setSearchQuery('') // Clear search when selecting a conversation
    shouldAutoScrollRef.current = true // Reset auto-scroll for new conversation
    previousMessagesLengthRef.current = 0 // Reset message count
    previousAssistantMessagesLengthRef.current = 0 // Reset assistant message count
    router.push(`/account/chat/${encodeURIComponent(otherUserId)}`)
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

  const scrollToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [])

  const handleArchiveConversation = useCallback(
    async (otherUserId: string, otherUserProId: string) => {
      if (!currentUserId) return
      try {
        await archiveConversation({
          userfid: currentUserId,
          otherUserfid: otherUserProId,
          otherUserId,
        })
        if (
          selectedConversationRef === otherUserProId ||
          selectedConversationRef === otherUserId
        ) {
          router.push('/account/chat')
        }
      } catch (error) {
        console.error('Error archiving conversation:', error)
      }
    },
    [archiveConversation, currentUserId, selectedConversationRef, router],
  )

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!currentUserId) return

      const folderId = await createConversationFolder({
        userfid: currentUserId,
        name,
      })
      setActiveFolderId(String(folderId))
    },
    [createConversationFolder, currentUserId],
  )

  const handleMoveConversation = useCallback(
    async (
      otherUserId: string,
      otherUserProId: string,
      folderId: string | null,
    ) => {
      if (!currentUserId) return

      await setConversationFolder({
        userfid: currentUserId,
        otherUserfid: otherUserProId,
        otherUserId,
        folderId: folderId ? (folderId as Id<'conversationFolders'>) : null,
      })
    },
    [setConversationFolder, currentUserId],
  )

  const handleRenameFolder = useCallback(
    async (folderId: Id<'conversationFolders'>, name: string) => {
      if (!currentUserId) return

      await renameConversationFolder({
        userfid: currentUserId,
        folderId,
        name,
      })
    },
    [currentUserId, renameConversationFolder],
  )

  // Find selected conversation by fid (null when conversation is archived)
  const selectedConversation = displayedConversations?.find(
    (conv) =>
      conv?.otherUser?.fid === selectedConversationRef ||
      conv?.otherUserId === selectedConversationRef ||
      (!!selectedConversationUser &&
        conv?.otherUser?.fid === selectedConversationFid),
  )

  // For archived conversations we have selectedUserProId but no selectedConversation; use profile for header when available
  const chatDisplayUser =
    selectedConversation?.otherUser ??
    (selectedConversationRef && otherUser
      ? {
          fid: selectedConversationFid ?? '',
          name: otherUser.name ?? null,
          email: otherUser.email ?? '',
          photoUrl: otherUser.photoUrl ?? null,
          proId: selectedConversationFid ?? '',
          displayName: otherUser.name ?? null,
          avatarUrl: otherUser.photoUrl ?? null,
        }
      : null)

  // On mobile, show either list or chat. On desktop, show both
  const showConversationList = !isMobile || !showChat
  const showChatArea = !isMobile || showChat

  return (
    <div className='relative flex h-full min-h-0 w-full overflow-hidden bg-background md:rounded-3xl md:border md:border-sidebar md:bg-sidebar/20'>
      {/* Conversation List Sidebar */}
      <aside
        className={cn(
          'flex min-h-0 flex-col overflow-hidden border-r border-sidebar bg-background/95 supports-backdrop-filter:backdrop-blur-xl transition-all duration-300',
          isMobile
            ? showConversationList
              ? 'w-full'
              : 'hidden'
            : 'w-88 shrink-0 lg:w-[24rem]',
        )}
      >
        <div className='z-10 shrink-0 bg-background/95 supports-backdrop-filter:backdrop-blur-xl'>
          <ConversationSearch
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
          />

          {folderingEnabled && (
            <ConversationFolderToolbar
              activeFolderId={effectiveActiveFolderId}
              counts={folderCounts}
              folders={folderOptions}
              onCreateFolder={handleCreateFolder}
              onRenameFolder={handleRenameFolder}
              onSelectFolder={setActiveFolderId}
            />
          )}
        </div>

        {/* Conversation List */}
        <ScrollArea className='min-h-0 flex-1'>
          <div className='pb-[max(12px,env(safe-area-inset-bottom))]'>
            {/* Assistant conversation - always first */}
            {!searchQuery.trim() && (
              <div className='border-b border-border/40'>
                <button
                  onClick={handleSelectAssistant}
                  className={cn(
                    'w-full px-3 py-3 text-left transition-all duration-200 active:bg-accent/70 md:px-4',
                    'touch-manipulation hover:bg-sidebar/70',
                    isAssistant &&
                      'border-l-2 border-l-brand bg-sidebar/80 md:border-l-4',
                  )}
                >
                  <div className='flex items-start gap-2 md:gap-3'>
                    <div className='relative shrink-0'>
                      <ChatAvatar
                        src='/svg/rf-logo-round-204-latest.svg'
                        label={assistantUser?.name ?? ASSISTANT_NAME}
                        fallback='RF'
                      />
                      <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-background' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='mb-1 flex items-center justify-between gap-2'>
                        <p className='flex truncate text-sm text-foreground items-center gap-1.5'>
                          <span className='font-okxs font-medium'>
                            {assistantUser?.name ?? ASSISTANT_NAME}
                          </span>
                          <span className='text-[10px] px-1.5 py-0.5 rounded-sm bg-sidebar text-brand dark:text-sky-50 font-polysans font-semibold'>
                            AI
                          </span>
                        </p>
                      </div>
                      <p className='truncate text-sm text-muted-foreground'>
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
              selectedProId={selectedConversationFid ?? selectedConversationRef}
              conversations={displayedConversations}
              folderOptions={folderOptions}
              onSelectConversation={handleSelectConversation}
              onArchiveConversation={handleArchiveConversation}
              onMoveConversation={
                folderingEnabled ? handleMoveConversation : undefined
              }
            />
          </div>
        </ScrollArea>
      </aside>

      {/* Chat Area */}
      <section
        className={cn(
          'flex min-h-0 flex-1 flex-col bg-background transition-all duration-300',
          isMobile && !showChatArea && 'hidden',
        )}
      >
        {isAssistant ? (
          <>
            {/* Assistant Chat Header */}
            <div className='sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-3 supports-backdrop-filter:backdrop-blur-xl md:h-16 md:px-5'>
              <div className='flex min-w-0 flex-1 items-center gap-0 md:gap-3'>
                {isMobile && (
                  <button
                    onClick={handleBackToConversations}
                    className='p-2 -ml-2 rounded-full hover:bg-sidebar transition-colors shrink-0 active:scale-95'
                  >
                    <Icon
                      name='chevron-left'
                      className='size-4 text-foreground'
                    />
                  </button>
                )}
                <div className='relative shrink-0'>
                  <ChatAvatar
                    src='/svg/rf-logo-round-204-latest.svg'
                    label={assistantUser?.name ?? ASSISTANT_NAME}
                    fallback='RF'
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
                    title='Clear conversation'
                  >
                    <Icon name='x' className='size-5 text-muted-foreground' />
                  </button>
                )}
              </div>
            </div>

            {/* Assistant Messages Area */}
            <ScrollArea ref={scrollAreaRef} className='min-h-0 flex-1'>
              <div className='mx-auto flex min-h-full w-full max-w-4xl flex-col px-3 py-4 pb-6 md:px-5 md:py-6 md:pb-8'>
                <AssistantMessageList
                  messages={assistantChat.messages}
                  isLoading={assistantChat.isLoading}
                  onQuickAction={sendAssistantQuickAction}
                  scrollAreaRef={scrollAreaRef}
                  scrollButtonAnchorEl={scrollButtonAnchorEl}
                  onScrollToBottom={scrollToBottom}
                />
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Scroll-to-bottom button anchor (above input) */}
            <div
              ref={setScrollButtonAnchorEl}
              className='relative z-10 shrink-0'
            />

            {/* Assistant Message Input */}
            <div
              className='sticky bottom-0 z-20 shrink-0 border-t border-border/40 bg-background/95 px-3 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.04)] supports-backdrop-filter:backdrop-blur-xl md:px-5 md:py-4'
              style={{
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}
            >
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
        ) : selectedConversationRef && chatDisplayUser ? (
          <>
            {/* Chat Header - Sticky (works for both listed and archived conversations) */}
            <div className='sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-3 supports-backdrop-filter:backdrop-blur-xl md:h-16 md:px-5'>
              <div className='flex min-w-0 flex-1 items-center gap-0 md:gap-3'>
                {/* Back button on mobile */}
                {isMobile && (
                  <button
                    onClick={handleBackToConversations}
                    className='p-2 -ml-2 rounded-full hover:bg-accent transition-colors shrink-0 active:scale-95'
                  >
                    <Icon
                      name='chevron-left'
                      className='size-4 text-foreground'
                    />
                  </button>
                )}
                <div className='relative shrink-0'>
                  {otherUser?.name ? (
                    <Link href={`/u/${otherUser.name}`}>
                      <ChatAvatar
                        src={chatDisplayUser.avatarUrl ?? undefined}
                        label={
                          chatDisplayUser.displayName ??
                          chatDisplayUser.name ??
                          chatDisplayUser.email?.split('@')[0] ??
                          'Unknown User'
                        }
                      />
                    </Link>
                  ) : (
                    <ChatAvatar
                      src={chatDisplayUser.avatarUrl ?? undefined}
                      label={
                        chatDisplayUser.displayName ??
                        chatDisplayUser.name ??
                        chatDisplayUser.email?.split('@')[0] ??
                        'Unknown User'
                      }
                    />
                  )}
                  <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border border-white' />
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
            <ScrollArea ref={scrollAreaRef} className='min-h-0 flex-1'>
              <div className='mx-auto flex min-h-full w-full max-w-4xl flex-col px-3 py-4 pb-6 md:px-5 md:py-6 md:pb-8'>
                <MessageList
                  messages={messages}
                  currentUserProId={user?.uid ?? ''}
                  otherUserProId={selectedConversationFid ?? ''}
                  scrollAreaRef={scrollAreaRef}
                  scrollButtonAnchorEl={scrollButtonAnchorEl}
                  onScrollToBottom={scrollToBottom}
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

            {/* Scroll-to-bottom button anchor (above input) */}
            <div
              ref={setScrollButtonAnchorEl}
              className='relative z-10 shrink-0'
            />

            {/* Message Input */}
            <div
              className='sticky bottom-0 z-20 shrink-0 border-t border-border/40 bg-background/95 px-3 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.04)] supports-backdrop-filter:backdrop-blur-xl md:px-5 md:py-4'
              style={{
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}
            >
              <MessageInput
                receiverProId={selectedConversationFid ?? ''}
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
                    className='size-8 md:size-10 text-dark-table dark:text-white'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <h3 className='text-base md:text-lg font-polysans font-semibold opacity-80'>
                  Select a conversation
                </h3>
                <p className='text-xs md:text-sm opacity-70 max-w-sm mx-auto'>
                  {isMobile
                    ? 'Choose a conversation to start messaging'
                    : 'Choose a conversation from the sidebar to start messaging'}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
