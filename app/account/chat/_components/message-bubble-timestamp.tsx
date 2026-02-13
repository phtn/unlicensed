'use client'

import type {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimeCompact} from '@/utils/date'
import {Avatar} from '@heroui/react'
import {ViewTransition} from 'react'

interface User {
  displayName?: string | null
  email: string
  avatarUrl?: string | null
}

interface MessageBubbleTimestampProps {
  messageId: Id<'messages'>
  createdAt: string
  isCurrentUser: boolean
  isVisible: boolean
  isLastRead?: boolean
  otherUser?: User | null
  isLiked?: boolean
  likesCount?: number
  onLike?: VoidFunction
}

export function MessageBubbleTimestamp({
  createdAt,
  isCurrentUser,
  isVisible,
  isLastRead,
  otherUser,
  isLiked,
  onLike,
}: MessageBubbleTimestampProps) {
  return (
    <div className='relative w-full flex items-center gap-2 text-xs text-muted-foreground px-1'>
      {isCurrentUser ? (
        <>
          <div className='min-w-12 relative'>
            <ViewTransition
              name='chat-message-timestamp'
              enter='vt-enter'
              exit='vt-exit'>
              {isVisible ? (
                <span
                  key='timestamp'
                  className='font-brk absolute whitespace-nowrap top-0'>
                  {formatTimeCompact(createdAt)}
                </span>
              ) : null}
            </ViewTransition>
          </div>
          {isLastRead && otherUser && (
            <Avatar
              src={otherUser.avatarUrl ?? undefined}
              fallback={
                otherUser.displayName?.[0]?.toUpperCase() ??
                otherUser.email?.[0]?.toUpperCase() ??
                'U'
              }
              className='size-4 md:size-6 border border-foreground/50 shrink-0'
            />
          )}
        </>
      ) : (
        <div className='w-full'>
          {onLike && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLike()
              }}
              className={cn(
                'absolute -top-4 right-0 flex items-center gap-1 px-0.5 py-0.5 rounded-full transition-colors',
                isLiked
                  ? 'bg-transparent text-yellow-500'
                  : 'hover:bg-accent text-muted-foreground/40',
              )}>
              <Icon
                name='star-fill'
                className={cn('size-4', isLiked && 'size-4 fill-current')}
              />
            </button>
          )}
          <div className='min-w-12'>
            <ViewTransition
              name='chat-message-timestamp'
              enter='vt-enter'
              exit='vt-exit'>
              {isVisible ? (
                <span key='timestamp' className='font-space'>
                  {formatTimeCompact(createdAt)}
                </span>
              ) : null}
            </ViewTransition>
          </div>
        </div>
      )}
    </div>
  )
}
