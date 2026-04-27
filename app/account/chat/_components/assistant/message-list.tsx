'use client'

import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import {api} from '@/convex/_generated/api'
import {
  createAssistantCatalogLinkIndex,
  type AssistantCatalog,
} from '@/lib/assistant/catalog'
import {cn} from '@/lib/utils'
import {Avatar} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useMemo} from 'react'
import {ScrollToBottomButton} from '../scroll-to-bottom-button'
import {AssistantMarkdown} from './markdown'
import {ASSISTANT_NAME, type AssistantMessage} from './types'

const AssistantAvatar = ({className}: {className?: string}) => (
  <Avatar className={className}>
    <HeroAvatarImage
      alt={ASSISTANT_NAME}
      src='/svg/rf-logo-round-204-latest.svg'
    />
    <Avatar.Fallback>RF</Avatar.Fallback>
  </Avatar>
)

interface AssistantMessageListProps {
  messages: AssistantMessage[]
  isLoading: boolean
  onQuickAction?: (suggestion: string) => void
  scrollAreaRef?: React.RefObject<HTMLDivElement | null>
  scrollButtonAnchorEl?: HTMLDivElement | null
  onScrollToBottom?: () => void
}

export function AssistantMessageList({
  messages,
  isLoading,
  onQuickAction,
  scrollAreaRef,
  scrollButtonAnchorEl,
  onScrollToBottom,
}: AssistantMessageListProps) {
  const assistantRuntimeConfig = useQuery(
    api.assistant.q.getAssistantRuntimeConfig,
  )
  const catalogSupportEnabled =
    assistantRuntimeConfig?.catalogSupportEnabled ?? true
  const assistantCatalog = useQuery(
    api.assistant.q.getAssistantCatalog,
    catalogSupportEnabled ? {} : 'skip',
  ) as AssistantCatalog | undefined
  const catalogLinkIndex = useMemo(
    () =>
      catalogSupportEnabled
        ? createAssistantCatalogLinkIndex(assistantCatalog)
        : null,
    [assistantCatalog, catalogSupportEnabled],
  )

  // Group messages by date
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return []

    const groups: Array<{
      date: string
      messages: AssistantMessage[]
    }> = []

    let currentDate = ''
    let currentGroup: AssistantMessage[] = []

    messages.forEach((message, index) => {
      const messageDate = new Date(message.createdAt).toLocaleDateString(
        'en-US',
        {month: 'long', day: 'numeric', year: 'numeric'},
      )

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({date: currentDate, messages: currentGroup})
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }

      if (index === messages.length - 1) {
        groups.push({date: currentDate, messages: currentGroup})
      }
    })

    return groups
  }, [messages])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return dateString
    }
  }

  const quickActions = ['Check my order status?', 'What flavors are available?']

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center space-y-4 px-4 max-w-md'>
          <div className='space-y-2'>
            <div className='flex items-center space-x-2 py-2'>
              <AssistantAvatar />
              <h3 className='text-lg font-polysans font-medium'>
                Hi! I&apos;m {ASSISTANT_NAME}
              </h3>
            </div>
          </div>
          <div className='flex flex-wrap justify-center gap-2 pt-2'>
            {quickActions.map((suggestion) => (
              <button
                key={suggestion}
                type='button'
                disabled={!onQuickAction || isLoading}
                onClick={() => onQuickAction?.(suggestion)}
                className='text-xs px-3 py-1.5 rounded-full bg-sidebar'>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4 md:space-y-6'>
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className='space-y-3 md:space-y-4'>
          {/* Date Separator */}
          <div className='flex items-center justify-center'>
            <div className='px-2 md:px-3 py-1 rounded-full bg-sidebar/50 font-brk text-[8px] font-medium text-muted-foreground'>
              {formatDate(group.date)}
            </div>
          </div>

          {/* Messages in this group */}
          {group.messages.map((message, messageIndex) => {
            const isUser = message.role === 'user'
            const prevMessage =
              messageIndex > 0 ? group.messages[messageIndex - 1] : null
            const nextMessage =
              messageIndex < group.messages.length - 1
                ? group.messages[messageIndex + 1]
                : null
            const showAvatar = !prevMessage || prevMessage.role !== message.role
            const isLastInGroup =
              !nextMessage || nextMessage.role !== message.role

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-end relative',
                  isUser ? 'justify-end' : 'gap-2',
                )}>
                {/* Avatar - only for assistant (left side) */}
                {!isUser && (
                  <div className='w-4 md:w-8 shrink-0'>
                    {showAvatar ? (
                      <AssistantAvatar className='portrait:size-5' />
                    ) : null}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[85%] md:max-w-[75%]',
                    isUser && 'items-end',
                    !isUser && 'items-start',
                  )}>
                  <div
                    className={cn(
                      'rounded-2xl px-3 md:px-4 py-2',
                      isUser
                        ? 'bg-sidebar dark:bg-dark-table dark:text-white rounded-tr-sm'
                        : 'bg-foreground dark:bg-white dark:text-dark-table text-white rounded-tl-sm',
                      isLastInGroup &&
                        (isUser ? 'rounded-br-2xl' : 'rounded-bl-2xl'),
                    )}>
                    {isUser ? (
                      <p className='text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-word'>
                        {message.content}
                      </p>
                    ) : message.content ? (
                      <AssistantMarkdown
                        content={message.content}
                        linkIndex={catalogLinkIndex}
                      />
                    ) : null}

                    {/* Show typing indicator for the last assistant message while loading */}
                    {isLoading &&
                      !isUser &&
                      messageIndex === group.messages.length - 1 &&
                      groupIndex === groupedMessages.length - 1 &&
                      !message.content && (
                        <span className='inline-flex gap-1'>
                          <span className='size-1.5 bg-current rounded-full animate-bounce [animation-delay:0ms]' />
                          <span className='size-1.5 bg-current rounded-full animate-bounce [animation-delay:150ms]' />
                          <span className='size-1.5 bg-current rounded-full animate-bounce [animation-delay:300ms]' />
                        </span>
                      )}
                  </div>

                  {/* Timestamp */}
                  <span className='text-[8px] font-okxs text-foreground/60 tracking-wide px-4'>
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {/* Loading indicator when waiting for response */}
      {isLoading &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && (
          <div className='flex gap-2 items-end'>
            <div className='w-7 md:w-8 shrink-0'>
              <AssistantAvatar />
            </div>
            <div className='rounded-2xl rounded-tl-sm px-3 md:px-4 py-2 shadow-sm bg-muted'>
              <span className='inline-flex gap-1'>
                <span className='size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]' />
                <span className='size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]' />
                <span className='size-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]' />
              </span>
            </div>
          </div>
        )}

      {/* Scroll-to-bottom button (portaled above message input) */}
      {scrollAreaRef && scrollButtonAnchorEl && onScrollToBottom && (
        <ScrollToBottomButton
          scrollAreaRef={scrollAreaRef}
          scrollButtonAnchorEl={scrollButtonAnchorEl}
          onScrollToBottom={onScrollToBottom}
        />
      )}
    </div>
  )
}
