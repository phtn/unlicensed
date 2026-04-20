'use client'

import {
  ASSISTANT_AVATAR,
  ASSISTANT_NAME,
} from '@/app/account/chat/_components/assistant'
import {AssistantMessageInput} from '@/app/account/chat/_components/assistant-message-input'
import {AssistantMessageList} from '@/app/account/chat/_components/assistant-message-list'
import {MessageInput} from '@/app/account/chat/_components/message-input'
import {MessageList} from '@/app/account/chat/_components/message-list'
import {useAssistantChat} from '@/app/account/chat/_components/use-assistant-chat'
import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {ScrollArea} from '@/components/ui/scroll-area'
import {DialogWindow} from '@/components/ui/window'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {useGuestChatCtx} from '@/ctx/guest-chat'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {getInitials} from '@/utils/initials'
import {Avatar, ListBox, Select} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ASSISTANT_VALUE = '__assistant__'

interface ChatDockWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationFid?: string | null
  conversationSelectionKey?: number
}

type ConversationItem = {
  id: string
  fid: string
  displayName: string
  avatarUrl: string | null
}

type ChatSelectItem = {
  id: string
  label: string
  avatarUrl: string | null
}

export function ChatWindow({
  open,
  onOpenChange,
  conversationFid = null,
  conversationSelectionKey = 0,
}: ChatDockWindowProps) {
  const {user, setAuthModalOpen} = useAuthCtx()
  const guestChat = useGuestChatCtx()
  const [selectedConversation, setSelectedConversation] = useState<{
    fid: string | null | undefined
    requestKey: number
  }>({
    fid: undefined,
    requestKey: -1,
  })
  const [assistantDraft, setAssistantDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isGuestFlow = !user?.uid || guestChat.isMerging
  const guestConversationFid = guestChat.representativeFid
  const activeConversationFid = useMemo(() => {
    if (isGuestFlow) {
      return guestConversationFid
    }

    const shouldUseRequestedConversation =
      Boolean(conversationFid) &&
      conversationSelectionKey > selectedConversation.requestKey

    if (shouldUseRequestedConversation) {
      return conversationFid
    }

    return selectedConversation.fid === undefined
      ? conversationFid
      : selectedConversation.fid
  }, [
    conversationFid,
    conversationSelectionKey,
    guestConversationFid,
    isGuestFlow,
    selectedConversation,
  ])
  const isConversationMode = Boolean(activeConversationFid)
  const activeChatFid = guestChat.activeChatFid
  const assistantChat = useAssistantChat({
    enabled: open && !isConversationMode && !isGuestFlow,
  })
  const markAsRead = useMutation(api.messages.m.markAsRead)

  useEffect(() => {
    if (!open || !isGuestFlow) {
      return
    }

    void guestChat.ensureSession()
  }, [guestChat, isGuestFlow, open])

  const conversations = useQuery(
    api.messages.q.getConversations,
    open && activeChatFid ? {fid: activeChatFid} : 'skip',
  )
  const conversationMessages = useQuery(
    api.messages.q.getMessages,
    open && activeConversationFid && activeChatFid
      ? {
          currentUserId: activeChatFid,
          otherUserId: activeConversationFid,
        }
      : 'skip',
  )

  const lastConversationMessageId =
    conversationMessages?.[conversationMessages.length - 1]?._id

  const conversationItems = useMemo<ConversationItem[]>(() => {
    const items = (conversations ?? []).flatMap((conversation) => {
      const fid = conversation?.otherUser?.proId ?? conversation?.otherUser?.fid
      if (!conversation || !fid) return []

      return [
        {
          id: conversation.otherUserId,
          fid,
          displayName:
            conversation.otherUser?.displayName ??
            conversation.otherUser?.name ??
            conversation.otherUser?.email?.split('@').shift() ??
            'User',
          avatarUrl:
            conversation.otherUser?.avatarUrl ??
            conversation.otherUser?.photoUrl ??
            null,
        },
      ]
    })

    if (
      items.length === 0 &&
      guestChat.representativeFid &&
      guestChat.representative
    ) {
      return [
        {
          id: guestChat.representativeFid,
          fid: guestChat.representativeFid,
          displayName:
            guestChat.representative.name ||
            guestChat.representative.email.split('@')[0] ||
            'Support',
          avatarUrl: guestChat.representative.photoUrl,
        },
      ]
    }

    return items
  }, [conversations, guestChat.representative, guestChat.representativeFid])

  const activeConversationItem = useMemo(
    () =>
      conversationItems.find(
        (conversation) => conversation.fid === activeConversationFid,
      ) ?? null,
    [activeConversationFid, conversationItems],
  )

  const handleWindowOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSelectedConversation({
          fid: undefined,
          requestKey: -1,
        })
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({behavior, block: 'end'})
  }, [])

  useEffect(() => {
    if (!open) return

    const timeoutId = window.setTimeout(() => {
      scrollToBottom('auto')
    }, 80)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [open, scrollToBottom])

  useEffect(() => {
    if (!open || isConversationMode || assistantChat.messages.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      scrollToBottom()
    }, 20)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [assistantChat.messages.length, isConversationMode, open, scrollToBottom])

  useEffect(() => {
    if (!open || !isConversationMode || !conversationMessages?.length) return

    const timeoutId = window.setTimeout(() => {
      scrollToBottom()
    }, 20)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [conversationMessages?.length, isConversationMode, open, scrollToBottom])

  useEffect(() => {
    if (!open || !activeConversationFid || !activeChatFid) return

    void markAsRead({
      senderfid: activeConversationFid,
      receiverfid: activeChatFid,
    })
  }, [
    activeChatFid,
    activeConversationFid,
    lastConversationMessageId,
    markAsRead,
    open,
  ])

  const sendQuickAction = useCallback(
    async (suggestion: string) => {
      if (assistantChat.isLoading) return

      startTransition(() => {
        setAssistantDraft(suggestion)
      })

      await assistantChat.sendMessage(suggestion)

      startTransition(() => {
        setAssistantDraft('')
      })

      scrollToBottom()
    },
    [assistantChat, scrollToBottom],
  )

  const windowDescription = useMemo(() => {
    if (guestChat.error && isGuestFlow) {
      return 'Support unavailable'
    }

    if (guestChat.isMerging) {
      return 'Moving this chat into your account...'
    }

    if (isGuestFlow) {
      return guestChat.isBootstrapping
        ? 'Connecting you with support...'
        : 'Guest support chat'
    }

    if (isConversationMode) {
      return 'Customer conversation'
    }

    return assistantChat.isLoading ? 'Typing ...' : 'Always available'
  }, [
    assistantChat.isLoading,
    guestChat.error,
    guestChat.isBootstrapping,
    guestChat.isMerging,
    isConversationMode,
    isGuestFlow,
  ])

  const conversationSelectValue = isConversationMode
    ? (activeConversationFid ?? '')
    : ASSISTANT_VALUE

  const selectItems = useMemo(
    (): ChatSelectItem[] => [
      {
        id: ASSISTANT_VALUE,
        label: ASSISTANT_NAME,
        avatarUrl: ASSISTANT_AVATAR,
      },
      ...conversationItems.map((conversation) => ({
        id: conversation.fid,
        label: conversation.displayName,
        avatarUrl: conversation.avatarUrl,
      })),
    ],
    [conversationItems],
  )

  const isConversationReady = Boolean(activeChatFid && activeConversationFid)
  const showGuestStatusPanel = isGuestFlow && !isConversationReady

  const guestHeader = (
    <div className='flex min-w-0 items-center gap-2 ps-1'>
      <ChatParticipantAvatar
        label={activeConversationItem?.displayName ?? 'Support'}
        avatarUrl={activeConversationItem?.avatarUrl ?? null}
      />
      <div className='min-w-0'>
        <p className='truncate text-sm font-clash font-medium'>
          {activeConversationItem?.displayName ?? 'Support'}
        </p>
      </div>
    </div>
  )

  const windowActions = (() => {
    if (!user?.uid && !guestChat.isMerging) {
      return (
        <button
          type='button'
          onClick={() => {
            setAuthModalOpen(true)
          }}
          className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground font-okxs'>
          Sign in
        </button>
      )
    }

    if (user?.uid && isConversationMode && activeConversationFid) {
      return (
        <Link
          href={`/account/chat/${activeConversationFid}`}
          className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground'>
          <Icon name='external-link-line' className='size-4' />
        </Link>
      )
    }

    if (!isGuestFlow && assistantChat.messages.length > 0) {
      return (
        <button
          type='button'
          onClick={assistantChat.clearMessages}
          className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground font-okxs'>
          Clear
        </button>
      )
    }

    return null
  })()

  return (
    <DialogWindow
      open={open}
      onOpenChange={handleWindowOpenChange}
      className={cn(
        'left-auto right-4 translate-x-0 rounded-3xl border-dark-table',
        'bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)]',
        'w-[min(calc(100vw-2.5rem),34rem)] md:w-[min(calc(100vw-4rem),34rem)] min-[384px]:min-w-86',
        'h-[min(580px,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5rem))]',
        'md:h-[min(580px,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-7rem))]',
        'max-h-[600.1px] min-h-48',
      )}
      title={
        isGuestFlow ? (
          guestHeader
        ) : (
          <div className='w-1/2 min-w-0'>
            <Select
              selectedKey={conversationSelectValue}
              onSelectionChange={(key) => {
                const nextFid =
                  key == null
                    ? null
                    : typeof key === 'string'
                      ? key
                      : String(key)

                setSelectedConversation({
                  fid: nextFid === ASSISTANT_VALUE || !nextFid ? null : nextFid,
                  requestKey: conversationSelectionKey,
                })
              }}
              variant='secondary'
              className='w-full'
              aria-label='Select conversation'>
              <Select.Trigger className='min-h-8 h-8 w-full bg-sidebar/40 shadow-none data-[hover=true]:bg-sidebar'>
                <Select.Value className='text-sm md:text-base font-medium font-clash ring-brand outline-brand' />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className='-mt-1'>
                <ListBox className='px-2'>
                  {selectItems.map((item) => (
                    <ListBox.Item
                      id={item.id}
                      key={item.id}
                      textValue={item.label}
                      className='hover:bg-sidebar!'>
                      <div className='flex items-center gap-2'>
                        <ChatParticipantAvatar
                          label={item.label}
                          avatarUrl={item.avatarUrl}
                        />
                        <span>{item.label}</span>
                      </div>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        )
      }
      description={windowDescription}
      descriptionStyle='mt-1.5 ps-2 font-pixel-grid font-medium tracking-wide'
      actions={windowActions}>
      <div className='flex h-full min-h-0 flex-col border-t border-foreground/20 dark:border-dark-table w-full bg-sidebar'>
        <ScrollArea className='min-h-0 flex-1 relative'>
          <div className="absolute w-full h-full inset-0 bg-[url('/svg/noise.svg')] opacity-10 scale-100 pointer-events-none" />
          <div className='px-3 py-3 pb-6'>
            {guestChat.error && isGuestFlow ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>
                {guestChat.error}
              </div>
            ) : showGuestStatusPanel ? (
              <div className='py-8 text-center text-sm text-muted-foreground'>
                {guestChat.isMerging
                  ? 'Finishing your sign-in handoff...'
                  : 'Starting your guest chat...'}
              </div>
            ) : isConversationMode ? (
              <MessageList
                messages={conversationMessages}
                currentUserProId={activeChatFid ?? ''}
                otherUserProId={activeConversationFid ?? ''}
              />
            ) : (
              <AssistantMessageList
                messages={assistantChat.messages}
                isLoading={assistantChat.isLoading}
                onQuickAction={sendQuickAction}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div
          className='shrink-0 border-t border-foreground/20 dark:border-dark-table bg-background/90 p-3'
          style={{paddingBottom: 'max(12px, env(safe-area-inset-bottom))'}}>
          {guestChat.error &&
          isGuestFlow ? null : showGuestStatusPanel ? null : isConversationMode ? (
            <MessageInput
              receiverProId={activeConversationFid ?? ''}
              senderProId={activeChatFid ?? ''}
              onMessageSent={() => {
                scrollToBottom()
              }}
            />
          ) : (
            <AssistantMessageInput
              onSendMessage={assistantChat.sendMessage}
              isLoading={assistantChat.isLoading}
              value={assistantDraft}
              onValueChange={setAssistantDraft}
              autoFocus={open}
              onMessageSent={() => {
                scrollToBottom()
              }}
            />
          )}
        </div>
      </div>
    </DialogWindow>
  )
}

const ChatParticipantAvatar = ({
  label,
  avatarUrl,
}: {
  label: string
  avatarUrl: string | null
}) => {
  return (
    <Avatar className='shrink-0 bg-sidebar dark:bg-dark-table' size='sm'>
      {avatarUrl ? <HeroAvatarImage alt={label} src={avatarUrl} /> : null}
      <Avatar.Fallback className='font-polysans font-semibold text-sm text-brand'>
        {getInitials(label)}
      </Avatar.Fallback>
    </Avatar>
  )
}
