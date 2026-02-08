'use client'

import {
  type MessageAttachmentArray,
  LastMessage,
  OtherUser,
} from '@/convex/messages/d'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {formatRecordingTime} from '@/utils/time'
import {Avatar} from '@heroui/react'
import {
  Fragment,
  ReactNode,
  TouchEvent,
  useCallback,
  useRef,
  useState,
} from 'react'

export interface Conversation {
  otherUserId: string
  otherUser: OtherUser | null
  lastMessage: LastMessage
  unreadCount: number
  hasMessages: boolean
}

interface ConversationListProps {
  conversations: Conversation[] | undefined
  selectedProId: string | null
  onSelectConversation: (otherUserId: string, otherUserProId: string) => void
  onArchiveConversation?: (otherUserId: string, otherUserProId: string) => void
}

const ARCHIVE_BUTTON_WIDTH = 80

function SwipeableConversationRow({
  conversation,
  onArchive,
  children,
}: {
  conversation: Conversation
  onArchive: (otherUserId: string, otherUserProId: string) => void
  children: ReactNode
}) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartX = useRef(0)
  const touchStartTranslate = useRef(0)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX
      touchStartTranslate.current = translateX
      setIsDragging(true)
    },
    [translateX],
  )
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current
    const next = Math.max(
      -ARCHIVE_BUTTON_WIDTH,
      Math.min(0, touchStartTranslate.current + deltaX),
    )
    setTranslateX(next)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setTranslateX((current) =>
      current < -ARCHIVE_BUTTON_WIDTH / 2 ? -ARCHIVE_BUTTON_WIDTH : 0,
    )
  }, [])

  const handleArchiveClick = useCallback(() => {
    onArchive(
      conversation.otherUserId,
      conversation.otherUser?.proId ?? conversation.otherUser?.fid ?? '',
    )
  }, [
    conversation.otherUserId,
    conversation.otherUser?.proId,
    conversation.otherUser?.fid,
    onArchive,
  ])

  return (
    <div className='relative overflow-hidden'>
      <div
        className='flex touch-none'
        style={{
          width: `calc(100% + ${ARCHIVE_BUTTON_WIDTH}px)`,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}>
        <div className='min-w-0 shrink-0' style={{width: 'calc(100% - 80px)'}}>
          {children}
        </div>
        <div
          className='flex shrink-0 items-center justify-center bg-destructive/90 dark:bg-destructive/80'
          style={{width: ARCHIVE_BUTTON_WIDTH}}>
          <button
            type='button'
            onClick={handleArchiveClick}
            className='flex flex-col items-center justify-center text-white gap-1 py-2 text-destructive-foreground touch-manipulation'>
            <Icon name='archive' className='size-5 text-white' />
            <span className='text-xs font-medium'>Archive</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConversationList({
  conversations,
  selectedProId,
  onSelectConversation,
  onArchiveConversation,
}: ConversationListProps) {
  // Filter out null conversations and cast to expected type
  const validConversations = (conversations?.filter((conv) => conv !== null) ??
    []) as Conversation[]

  if (validConversations.length === 0) {
    return (
      <div className='p-4 md:p-6 text-center'>
        <p className='text-sm text-muted-foreground'>No connections yet</p>
        <p className='text-xs text-muted-foreground mt-1'>
          Follow someone to start chatting!
        </p>
      </div>
    )
  }

  return (
    <div className='divide-y divide-border/40'>
      {validConversations.map((conversation) => {
        const isSelected =
          conversation.otherUser?.proId === selectedProId ||
          conversation.otherUser?.fid === selectedProId
        const displayName =
          conversation.otherUser?.displayName ??
          conversation.otherUser?.name ??
          conversation.otherUser?.email?.split('@')[0] ??
          'Unknown User'
        const initials = displayName[0]?.toUpperCase() || 'U'
        const isUnread = conversation.unreadCount > 0

        // Check if last message has attachments and determine type
        const lastMessageAttachments: MessageAttachmentArray =
          conversation.lastMessage?.attachments ?? []
        const audioAttachments = lastMessageAttachments.filter((att) =>
          att.fileType.startsWith('audio/'),
        )
        const imageAttachments = lastMessageAttachments.filter((att) =>
          att.fileType.startsWith('image/'),
        )
        const hasAudioAttachment = audioAttachments.length > 0
        const hasImageAttachment = imageAttachments.length > 0

        // Parse duration from content for audio messages
        // Content stores duration in seconds as a string when it's an audio message
        const getAudioDuration = () => {
          if (!hasAudioAttachment || !conversation.lastMessage?.content) {
            return null
          }
          const durationSeconds = parseInt(conversation.lastMessage.content, 10)
          if (isNaN(durationSeconds) || durationSeconds <= 0) {
            return null
          }
          return formatRecordingTime(durationSeconds)
        }

        const audioDuration = getAudioDuration()

        const rowContent = (
          <button
            onClick={() => {
              const fid =
                conversation.otherUser?.proId ??
                conversation.otherUser?.fid ??
                ''
              if (fid) {
                onSelectConversation(conversation.otherUserId, fid)
              }
            }}
            className={cn(
              'w-full px-3 md:px-4 py-3 text-left transition-all duration-200 active:bg-blue-800',
              'touch-manipulation',
              isSelected &&
                'bg-blue-500/10 border-l-2 md:border-l-4 border-l-blue-800',
            )}>
            <div className='flex items-start gap-2 md:gap-3'>
              <div className='relative shrink-0'>
                <Avatar src={conversation.otherUser?.avatarUrl ?? undefined} />
                <div className='absolute bottom-0 right-0 size-2.5 md:size-3 rounded-full bg-green-500 border-2 border-background' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center justify-between gap-2 mb-0.5'>
                  <p
                    className={cn(
                      'truncate font-semibold text-sm',
                      isUnread && 'text-foreground',
                      !isUnread && 'text-foreground/80',
                    )}>
                    {displayName}
                  </p>
                  {conversation.hasMessages && (
                    <span className='shrink-0 text-xs text-muted-foreground font-medium'>
                      {formatTimestamp(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className='flex items-center justify-between gap-2'>
                  {conversation.hasMessages ? (
                    hasAudioAttachment ? (
                      <div className='flex items-center gap-2'>
                        <Icon
                          name='soundwave-bold'
                          className={cn(
                            'size-4 shrink-0',
                            isUnread
                              ? 'text-indigo-500'
                              : 'text-muted-foreground/60',
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs',
                            isUnread
                              ? 'text-foreground font-semibold tracking-tighter'
                              : 'opacity-60',
                          )}>
                          {audioDuration ?? ''}
                        </span>
                      </div>
                    ) : hasImageAttachment ? (
                      <div className='flex items-center gap-2'>
                        <Icon
                          name='image-bold'
                          className={cn(
                            'size-4 shrink-0',
                            isUnread
                              ? 'text-pink-400'
                              : 'text-muted-foreground/60',
                          )}
                        />
                        <span
                          className={cn(
                            'text-xs',
                            isUnread
                              ? 'text-foreground font-semibold tracking-tighter'
                              : 'opacity-60',
                          )}>
                          {imageAttachments.length}{' '}
                          {imageAttachments.length === 1 ? 'photo' : 'photos'}
                        </span>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          'truncate max-w-50 text-sm',
                          isUnread
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground',
                        )}>
                        {conversation.lastMessage.content}
                      </p>
                    )
                  ) : (
                    <p className='truncate max-w-50 text-sm text-muted-foreground/60 italic'>
                      Start a conversation
                    </p>
                  )}
                  {isUnread && (
                    <span className='shrink-0 flex size-5 md:size-6 items-center justify-center aspect-square rounded-full bg-primary text-xs font-extrabold text-white dark:text-white'>
                      {conversation.unreadCount > 9
                        ? '9+'
                        : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )

        return onArchiveConversation ? (
          <SwipeableConversationRow
            key={conversation.otherUserId}
            conversation={conversation}
            onArchive={onArchiveConversation}>
            {rowContent}
          </SwipeableConversationRow>
        ) : (
          <Fragment key={conversation.otherUserId}>{rowContent}</Fragment>
        )
      })}
    </div>
  )
}
