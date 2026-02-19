'use client'

import {ASSISTANT_NAME} from '@/app/account/chat/_components/assistant'
import {AssistantMessageInput} from '@/app/account/chat/_components/assistant-message-input'
import {AssistantMessageList} from '@/app/account/chat/_components/assistant-message-list'
import {MessageInput} from '@/app/account/chat/_components/message-input'
import {MessageList} from '@/app/account/chat/_components/message-list'
import {useAssistantChat} from '@/app/account/chat/_components/use-assistant-chat'
import {ScrollArea} from '@/components/ui/scroll-area'
import {DialogWindow} from '@/components/ui/window'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isConversationMode = Boolean(conversationFid)
  const markAsRead = useMutation(api.messages.m.markAsRead)
  const otherUser = useQuery(
    api.users.q.getByFid,
    conversationFid ? {fid: conversationFid} : 'skip',
  )
  const conversationMessages = useQuery(
    api.messages.q.getMessages,
    conversationFid && user?.uid
      ? {
          currentUserId: user.uid,
          otherUserId: conversationFid,
        }
      : 'skip',
  )
  const lastConversationMessageId =
    conversationMessages?.[conversationMessages.length - 1]?._id

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
    if (!open || isConversationMode || assistantChat.messages.length === 0) return

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
    if (!open || !conversationFid || !user?.uid) return
    void markAsRead({
      senderfid: conversationFid,
      receiverfid: user.uid,
    })
  }, [conversationFid, lastConversationMessageId, markAsRead, open, user?.uid])

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
    : (assistantChat.isLoading ? 'Typing...' : 'Always available')

  return (
    <DialogWindow
      open={open}
      onOpenChange={onOpenChange}
      className='left-auto right-4 w-[min(calc(100vw-2.5rem),30rem)] translate-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] p-1 rounded-3xl border-dark-table'
      title={windowTitle}
      description={windowDescription}
      actions={
        isConversationMode && conversationFid ? (
          <Link
            href={`/account/chat/${conversationFid}`}
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
      <div className='flex h-full min-h-0 flex-col'>
        <ScrollArea className='min-h-0 flex-1'>
          <div className='px-3 py-3 pb-6'>
            {isConversationMode ? (
              user?.uid && conversationFid ? (
                <MessageList
                  messages={conversationMessages}
                  currentUserProId={user.uid}
                  otherUserProId={conversationFid}
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
            user?.uid && conversationFid ? (
              <MessageInput
                receiverProId={conversationFid}
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
