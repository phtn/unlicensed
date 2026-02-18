'use client'

import {ASSISTANT_NAME} from '@/app/account/chat/_components/assistant'
import {AssistantMessageInput} from '@/app/account/chat/_components/assistant-message-input'
import {AssistantMessageList} from '@/app/account/chat/_components/assistant-message-list'
import {useAssistantChat} from '@/app/account/chat/_components/use-assistant-chat'
import {ScrollArea} from '@/components/ui/scroll-area'
import {DialogWindow} from '@/components/ui/window'
import {startTransition, useCallback, useEffect, useRef, useState} from 'react'

interface ChatDockWindowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatWindow({open, onOpenChange}: ChatDockWindowProps) {
  const assistantChat = useAssistantChat()
  const [assistantDraft, setAssistantDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    if (!open || assistantChat.messages.length === 0) return

    const timeoutId = window.setTimeout(() => {
      scrollToBottom()
    }, 20)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [assistantChat.messages.length, open, scrollToBottom])

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

  return (
    <DialogWindow
      open={open}
      onOpenChange={onOpenChange}
      className='left-auto right-4 w-[min(calc(100vw-2.5rem),30rem)] translate-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:right-8 md:bottom-[calc(env(safe-area-inset-bottom)+8rem)] p-1 rounded-3xl border-dark-table'
      title={ASSISTANT_NAME}
      description={assistantChat.isLoading ? 'Typing...' : 'Always available'}
      actions={
        assistantChat.messages.length > 0 ? (
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
            <AssistantMessageList
              messages={assistantChat.messages}
              isLoading={assistantChat.isLoading}
              onQuickAction={sendQuickAction}
            />
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div
          className='shrink-0 border-t border-border/40 bg-background/90 p-3'
          style={{paddingBottom: 'max(12px, env(safe-area-inset-bottom))'}}>
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
        </div>
      </div>
    </DialogWindow>
  )
}
