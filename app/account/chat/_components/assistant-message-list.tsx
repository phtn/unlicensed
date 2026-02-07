'use client'

import {cn} from '@/lib/utils'
import {Avatar} from '@heroui/react'
import DOMPurify from 'dompurify'
import {marked} from 'marked'
import {useMemo} from 'react'
import {ASSISTANT_NAME, type AssistantMessage} from './assistant'

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function AssistantMarkdown({content}: {content: string}) {
  const sanitizedHtml = useMemo(() => {
    const parsed = marked.parse(content, {
      gfm: true,
      breaks: true,
    })

    const rawHtml =
      typeof parsed === 'string' ? parsed : `<pre>${escapeHtml(content)}</pre>`

    return DOMPurify.sanitize(rawHtml, {USE_PROFILES: {html: true}})
  }, [content])

  return (
    <div
      className={cn(
        'text-sm md:text-base leading-relaxed wrap-break-words',
        // basic markdown styling without relying on typography plugin
        '[&_p]:m-0 [&_p+p]:mt-3',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-1',
        '[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-black/10 [&_pre]:p-3',
        '[&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5',
        '[&_a]:underline [&_a]:underline-offset-2 [&_a]:wrap-break-word',
        '[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground',
      )}
      dangerouslySetInnerHTML={{__html: sanitizedHtml}}
    />
  )
}

interface AssistantMessageListProps {
  messages: AssistantMessage[]
  isLoading: boolean
  onQuickAction?: (suggestion: string) => void
}

export function AssistantMessageList({
  messages,
  isLoading,
  onQuickAction,
}: AssistantMessageListProps) {
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
          <Avatar src='/svg/rf-logo-round-204-latest.svg' />
          <div className='space-y-2'>
            <h3 className='text-lg font-polysans font-medium'>
              Hi! I&apos;m {ASSISTANT_NAME}
            </h3>
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
            <div className='px-2 md:px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground'>
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
                  'flex gap-2 items-end relative',
                  isUser && 'flex-row-reverse',
                )}>
                {/* Avatar */}
                <div className='w-7 md:w-8 shrink-0'>
                  {showAvatar && !isUser ? (
                    <Avatar src='/svg/rf-logo-round-204-latest.svg' />
                  ) : showAvatar && isUser ? (
                    <Avatar className='size-7 md:size-8 border-2 border-background'></Avatar>
                  ) : null}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'flex flex-col gap-1 max-w-[75%] md:max-w-[70%]',
                    isUser && 'items-end',
                    !isUser && 'items-start',
                  )}>
                  <div
                    className={cn(
                      'rounded-2xl px-3 md:px-4 py-2',
                      isUser
                        ? 'bg-dark-table text-white rounded-tr-sm'
                        : 'bg-sidebar text-foreground rounded-tl-sm',
                      isLastInGroup &&
                        (isUser ? 'rounded-br-2xl' : 'rounded-bl-2xl'),
                    )}>
                    {isUser ? (
                      <p className='text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-words'>
                        {message.content}
                      </p>
                    ) : message.content ? (
                      <AssistantMarkdown content={message.content} />
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
                  <span className='text-[8px] font-brk text-muted-foreground px-2'>
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
              <Avatar src={'/svg/rf-logo-round-204-latest.svg'} />
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
    </div>
  )
}
