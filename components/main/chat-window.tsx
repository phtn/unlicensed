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
import {cn} from '@/lib/utils'
import {Avatar} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {startTransition, useCallback, useEffect, useRef, useState} from 'react'

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

  const windowTitle = isConversationMode
    ? (otherUser?.name ?? otherUser?.email?.split('@').shift() ?? 'Live Chat')
    : ASSISTANT_NAME
  const windowDescription = isConversationMode
    ? 'Customer conversation'
    : assistantChat.isLoading
      ? 'Typing...'
      : 'Always available'

  return (
    <DialogWindow
      open={open}
      onOpenChange={handleWindowOpenChange}
      className='left-auto right-4 w-[min(calc(100vw-2.5rem),34rem)] translate-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] p-1 rounded-3xl border-dark-table md:min-h-180'
      title={windowTitle}
      description={windowDescription}
      actions={
        isConversationMode && activeConversationFid ? (
          <Link
            href={`/account/chat/${activeConversationFid}`}
            className='rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar hover:text-foreground'>
            Open full chat
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
      <div className='flex h-full min-h-0'>
        <aside className='w-14 shrink-0 border-r border-border/40 bg-sidebar/20'>
          <ScrollArea className='h-full'>
            <div className='flex flex-col items-center gap-2 px-2 py-3'>
              <button
                type='button'
                aria-label={`Open ${ASSISTANT_NAME}`}
                title={ASSISTANT_NAME}
                onClick={() => {
                  setSelectedConversationFid(null)
                }}
                className={cn(
                  'rounded-full p-0.5 transition-colors hover:bg-sidebar',
                  !isConversationMode && 'bg-sidebar',
                )}>
                <Avatar src={ASSISTANT_AVATAR} name={ASSISTANT_NAME} />
              </button>
              {conversationItems.map((conversation) => (
                <button
                  key={conversation.id}
                  type='button'
                  aria-label={`Open conversation with ${conversation.displayName}`}
                  title={conversation.displayName}
                  onClick={() => {
                    setSelectedConversationFid(conversation.fid)
                  }}
                  className={cn(
                    'rounded-full p-0.5 transition-colors hover:bg-sidebar',
                    conversation.fid === activeConversationFid && 'bg-sidebar',
                  )}>
                  <Avatar
                    src={conversation.avatarUrl ?? undefined}
                    name={conversation.displayName}
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <div className='flex min-w-0 flex-1 flex-col'>
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
      </div>
    </DialogWindow>
  )
}
