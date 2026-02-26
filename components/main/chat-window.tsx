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
import {ScrollArea} from '@/components/ui/scroll-area'
import {DialogWindow} from '@/components/ui/window'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {Avatar, Select, SelectItem} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {startTransition, useCallback, useEffect, useRef, useState} from 'react'

const ASSISTANT_VALUE = '__assistant__'

interface ChatDockWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationFid?: string | null
}

export function ChatWindow({
  open,
  onOpenChange,
  conversationFid = null,
}: ChatDockWindowProps) {
  const {user} = useAuthCtx()
  const assistantChat = useAssistantChat()
  const [assistantDraft, setAssistantDraft] = useState('')
  const [selectedConversationFid, setSelectedConversationFid] = useState<
    string | null | undefined
  >(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConversationFid =
    selectedConversationFid === undefined
      ? conversationFid
      : selectedConversationFid
  const isConversationMode = Boolean(activeConversationFid)
  const markAsRead = useMutation(api.messages.m.markAsRead)
  const conversations = useQuery(
    api.messages.q.getConversations,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const otherUser = useQuery(
    api.users.q.getByFid,
    activeConversationFid ? {fid: activeConversationFid} : 'skip',
  )
  const conversationMessages = useQuery(
    api.messages.q.getMessages,
    activeConversationFid && user?.uid
      ? {
          currentUserId: user.uid,
          otherUserId: activeConversationFid,
        }
      : 'skip',
  )
  const lastConversationMessageId =
    conversationMessages?.[conversationMessages.length - 1]?._id
  const conversationItems = (conversations ?? []).flatMap((conversation) => {
    const fid = conversation?.otherUser?.proId ?? conversation?.otherUser?.fid
    if (!conversation || !fid) return []

    return [
      {
        id: conversation.otherUserId,
        fid,
        displayName:
          conversation?.otherUser?.displayName ??
          conversation?.otherUser?.name ??
          conversation?.otherUser?.email?.split('@').shift() ??
          'User',
        avatarUrl:
          conversation?.otherUser?.avatarUrl ??
          conversation?.otherUser?.photoUrl ??
          null,
      },
    ]
  })

  const handleWindowOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSelectedConversationFid(undefined)
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
    if (!open || isConversationMode || assistantChat.messages.length === 0)
      return

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
    if (!open || !activeConversationFid || !user?.uid) return
    void markAsRead({
      senderfid: activeConversationFid,
      receiverfid: user.uid,
    })
  }, [
    activeConversationFid,
    lastConversationMessageId,
    markAsRead,
    open,
    user?.uid,
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

  const windowDescription = isConversationMode
    ? 'Customer conversation'
    : assistantChat.isLoading
      ? 'Typing ...'
      : 'Always available'

  const conversationSelectValue = isConversationMode
    ? (activeConversationFid ?? '')
    : ASSISTANT_VALUE

  const selectItems = [
    {key: ASSISTANT_VALUE, label: ASSISTANT_NAME, avatarUrl: ASSISTANT_AVATAR},
    ...conversationItems.map((c) => ({
      key: c.fid,
      label: c.displayName,
      avatarUrl: c.avatarUrl,
    })),
  ]

  return (
    <DialogWindow
      open={open}
      onOpenChange={handleWindowOpenChange}
      className='left-auto right-4 w-[min(calc(100vw-2.5rem),34rem)] translate-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] rounded-3xl border-dark-table md:min-h-180'
      title={
        <div className='w-1/2 min-w-0'>
          <Select
            items={selectItems}
            selectedKeys={[conversationSelectValue]}
            onSelectionChange={(keys) => {
              const key = Array.from(keys)[0] as string
              if (key === ASSISTANT_VALUE || !key) {
                setSelectedConversationFid(null)
              } else {
                setSelectedConversationFid(key)
              }
            }}
            size='sm'
            variant='flat'
            classNames={{
              trigger:
                'min-h-8 h-8 bg-sidebar/40 shadow-none data-[hover=true]:bg-sidebar',
              value: 'text-sm font-semibold',
              popoverContent: '-mt-1',
            }}
            aria-label='Select conversation'>
            {(item) => (
              <SelectItem key={item.key} textValue={item.label}>
                <div className='flex items-center gap-2'>
                  <Avatar
                    alt={item.label}
                    className='shrink-0'
                    name={item.label}
                    size='sm'
                    src={item.avatarUrl ?? undefined}
                  />
                  <span>{item.label}</span>
                </div>
              </SelectItem>
            )}
          </Select>
        </div>
      }
      description={windowDescription}
      descriptionStyle='ps-2'
      actions={
        isConversationMode && activeConversationFid ? (
          <Link
            href={`/account/chat/${activeConversationFid}`}
            className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground'>
            <Icon name='external-link-line' className='size-4' />
          </Link>
        ) : assistantChat.messages.length > 0 ? (
          <button
            type='button'
            onClick={assistantChat.clearMessages}
            className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground'>
            Clear
          </button>
        ) : null
      }>
      <div className='flex h-full min-h-0 flex-col border-t border-foreground/20 w-full'>
        <ScrollArea className='min-h-0 flex-1'>
          <div className='px-3 py-3 pb-6'>
            {isConversationMode ? (
              user?.uid && activeConversationFid ? (
                <MessageList
                  messages={conversationMessages}
                  currentUserProId={user.uid}
                  otherUserProId={activeConversationFid}
                />
              ) : (
                <div className='py-8 text-center text-sm text-muted-foreground'>
                  Sign in to chat with this customer.
                </div>
              )
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
          className='shrink-0 border-t border-border/40 bg-background/90 p-3'
          style={{paddingBottom: 'max(12px, env(safe-area-inset-bottom))'}}>
          {isConversationMode ? (
            user?.uid && activeConversationFid ? (
              <MessageInput
                receiverProId={activeConversationFid}
                senderProId={user.uid}
                onMessageSent={() => {
                  scrollToBottom()
                }}
              />
            ) : null
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
