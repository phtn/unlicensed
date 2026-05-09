'use client'

import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
import type {ConversationFolderSummary} from '@/convex/messages/d'
import {
  type LastMessage,
  type MessageAttachmentArray,
  type OtherUser,
} from '@/convex/messages/d'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {formatRecordingTime} from '@/utils/time'
import {Avatar} from '@heroui/react'
import {
  Fragment,
  ReactNode,
  PointerEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export interface Conversation {
  otherUserId: string
  otherUser: OtherUser | null
  lastMessage: LastMessage
  unreadCount: number
  hasMessages: boolean
  folderId?: string | null
  folderName?: string | null
}

type ArchiveConversationHandler = (
  otherUserId: string,
  otherUserProId: string,
) => void | Promise<void>

interface ConversationListProps {
  conversations: Conversation[] | undefined
  folderOptions?: ConversationFolderSummary[]
  selectedProId: string | null
  onSelectConversation: (otherUserId: string, otherUserProId: string) => void
  onArchiveConversation?: ArchiveConversationHandler
  onMoveConversation?: (
    otherUserId: string,
    otherUserProId: string,
    folderId: string | null,
  ) => void
}

const ARCHIVE_BUTTON_WIDTH = 80
const UNFILED_FOLDER_VALUE = '__unfiled__'
const ACTIVE_ONLINE_MS = 5 * 60 * 1000
const RECENTLY_ACTIVE_MS = 10 * 60 * 1000
const ACTIVITY_TICK_MS = 60 * 1000

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function getActivityDotClass(
  lastActiveAt: number | null | undefined,
  now: number,
) {
  if (!lastActiveAt) return 'bg-gray-200 dark:bg-dark-table'

  const elapsedMs = now - lastActiveAt
  if (elapsedMs < 0 || elapsedMs <= ACTIVE_ONLINE_MS) return 'bg-green-500'
  if (elapsedMs <= RECENTLY_ACTIVE_MS) return 'bg-orange-400'

  return 'bg-gray-200 dark:bg-dark-table'
}

function SwipeableConversationRow({
  conversation,
  onArchive,
  children,
}: {
  conversation: Conversation
  onArchive: ArchiveConversationHandler
  children: ReactNode
}) {
  const [translateX, setTranslateX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const pointerStartX = useRef(0)
  const pointerStartTranslate = useRef(0)
  const activePointerId = useRef<number | null>(null)
  const hasDragged = useRef(false)
  const suppressNextClick = useRef(false)
  const isPointerCaptured = useRef(false)

  const finishDrag = useCallback(() => {
    activePointerId.current = null
    isPointerCaptured.current = false
    setIsDragging(false)
    setTranslateX((current) =>
      current < -ARCHIVE_BUTTON_WIDTH / 2 ? -ARCHIVE_BUTTON_WIDTH : 0,
    )
  }, [])

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (
        event.button !== 0 ||
        event.pointerType === 'mouse' &&
          event.buttons !== 1
      ) {
        return
      }

      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('button,select,input,textarea,a')
      ) {
        return
      }

      activePointerId.current = event.pointerId
      pointerStartX.current = event.clientX
      pointerStartTranslate.current = translateX
      hasDragged.current = false
      isPointerCaptured.current = false
    },
    [translateX],
  )

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - pointerStartX.current
    if (!hasDragged.current && Math.abs(deltaX) <= 4) {
      return
    }

    if (!hasDragged.current) {
      hasDragged.current = true
      setIsDragging(true)

      if (!isPointerCaptured.current) {
        event.currentTarget.setPointerCapture(event.pointerId)
        isPointerCaptured.current = true
      }
    }

    setTranslateX(
      Math.max(
        -ARCHIVE_BUTTON_WIDTH,
        Math.min(0, pointerStartTranslate.current + deltaX),
      ),
    )
  }, [])

  const handlePointerUp = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return
      }

      if (hasDragged.current) {
        suppressNextClick.current = true
        window.setTimeout(() => {
          suppressNextClick.current = false
        }, 0)
      }

      finishDrag()
    },
    [finishDrag],
  )

  const handlePointerCancel = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return
      }

      finishDrag()
    },
    [finishDrag],
  )

  const handleClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-archive-action]')
      ) {
        suppressNextClick.current = false
        return
      }

      if (!suppressNextClick.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      suppressNextClick.current = false
    },
    [],
  )

  const handleArchiveClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (isArchiving) {
        return
      }

      const otherUserProId =
        conversation.otherUser?.proId ?? conversation.otherUser?.fid ?? ''

      setIsArchiving(true)
      void Promise.resolve(onArchive(conversation.otherUserId, otherUserProId))
        .then(() => {
          setTranslateX(0)
        })
        .catch((error) => {
          console.error('Error archiving conversation:', error)
        })
        .finally(() => {
          setIsArchiving(false)
        })
    },
    [
      conversation.otherUserId,
      conversation.otherUser?.proId,
      conversation.otherUser?.fid,
      isArchiving,
      onArchive,
    ],
  )

  const handleArchivePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      suppressNextClick.current = false
    },
    [],
  )

  return (
    <div className='relative overflow-hidden'>
      <div
        className={cn(
          'flex touch-pan-y select-none cursor-grab active:cursor-grabbing',
          isDragging && 'cursor-grabbing',
        )}
        style={{
          width: `calc(100% + ${ARCHIVE_BUTTON_WIDTH}px)`,
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}>
        <div className='min-w-0 shrink-0' style={{width: 'calc(100% - 80px)'}}>
          {children}
        </div>
        <div
          className='flex shrink-0 items-center justify-center bg-destructive/90 dark:bg-destructive/80'
          style={{width: ARCHIVE_BUTTON_WIDTH}}>
          <button
            type='button'
            data-archive-action
            disabled={isArchiving}
            aria-busy={isArchiving}
            onPointerDown={handleArchivePointerDown}
            onClick={handleArchiveClick}
            className='flex flex-col items-center justify-center text-white gap-1 px-3 py-2 touch-manipulation bg-light-brand active:scale-85 transition-transform duration-200 disabled:cursor-wait disabled:opacity-70'>
            <Icon
              name={isArchiving ? 'spinners-ring' : 'archive-fill'}
              className='size-5 text-white'
            />
            <span className='text-xs font-medium'>Archive</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConversationList({
  conversations,
  folderOptions,
  selectedProId,
  onSelectConversation,
  onArchiveConversation,
  onMoveConversation,
}: ConversationListProps) {
  const [folderEditorConversationId, setFolderEditorConversationId] = useState<
    string | null
  >(null)
  const [activityNow, setActivityNow] = useState(() => Date.now())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActivityNow(Date.now())
    }, ACTIVITY_TICK_MS)

    return () => window.clearInterval(intervalId)
  }, [])

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
        const isUnread = conversation.unreadCount > 0

        const folderControlFid =
          conversation.otherUser?.proId ?? conversation.otherUser?.fid ?? ''
        const showFolderPicker =
          !!folderOptions?.length || Boolean(onMoveConversation)
        const isFolderEditorOpen =
          folderEditorConversationId === conversation.otherUserId

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
        const currentFolderLabel = conversation.folderName?.trim() || 'Unsorted'
        const geolocationLabel =
          conversation.otherUser?.locationLabel?.trim() || null

        const rowContent = (
          <div
            className={cn(
              'touch-manipulation border-l-2 md:border-l-4 border-l-dark-gray/0 transition-all duration-200 max-w-sm',
              {
                'dark:bg-alum/20 bg-alum/20 border-l-dark-gray': isSelected,
              },
            )}>
            <div
              role='button'
              tabIndex={0}
              onClick={() => {
                if (folderControlFid) {
                  onSelectConversation(
                    conversation.otherUserId,
                    folderControlFid,
                  )
                }
              }}
              onKeyDown={(event) => {
                if (
                  !folderControlFid ||
                  (event.key !== 'Enter' && event.key !== ' ')
                ) {
                  return
                }

                event.preventDefault()
                onSelectConversation(conversation.otherUserId, folderControlFid)
              }}
              className='w-full cursor-pointer px-2 py-3 text-left active:bg-blue-100/10'>
              <div className='flex items-start gap-2.5 md:gap-3'>
                <div className='relative shrink-0'>
                  <Avatar>
                    {conversation.otherUser?.avatarUrl ? (
                      <HeroAvatarImage
                        alt={displayName}
                        src={conversation.otherUser.avatarUrl}
                      />
                    ) : null}
                    <Avatar.Fallback>
                      {getInitials(displayName)}
                    </Avatar.Fallback>
                  </Avatar>
                  <div
                    className={cn(
                      'absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background md:size-3',
                      getActivityDotClass(
                        conversation.otherUser?.lastActiveAt,
                        activityNow,
                      ),
                    )}
                  />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='mb-0 flex items-start justify-between gap-2'>
                    <p
                      className={cn(
                        'min-w-0 flex-1 truncate text-sm font-medium',
                        isUnread && 'text-foreground',
                        !isUnread && 'text-foreground/80',
                      )}>
                      {displayName}
                    </p>
                    {conversation.hasMessages && geolocationLabel && (
                      <span
                        id='geolocation'
                        className='max-w-18 shrink-0 text-right text-[8px] font-normal text-muted-foreground sm:max-w-none font-clash'>
                        {geolocationLabel}
                      </span>
                    )}
                  </div>
                  <div className='flex h-7 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='min-w-0 flex-1'>
                      {isFolderEditorOpen &&
                      showFolderPicker &&
                      folderControlFid &&
                      onMoveConversation ? (
                        <div
                          className='relative max-w-full'
                          onClick={(event) => event.stopPropagation()}>
                          <div className='pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center gap-1 pl-2'>
                            <Icon
                              name='chevron-right'
                              className='size-3.5 shrink-0 text-muted-foreground'
                            />
                          </div>
                          <select
                            aria-label={`Move ${displayName} conversation to a folder`}
                            value={
                              conversation.folderId ?? UNFILED_FOLDER_VALUE
                            }
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation()
                              const nextFolderId =
                                event.target.value === UNFILED_FOLDER_VALUE
                                  ? null
                                  : event.target.value
                              onMoveConversation(
                                conversation.otherUserId,
                                folderControlFid,
                                nextFolderId,
                              )
                              setFolderEditorConversationId(null)
                            }}
                            className='h-7 flex items-center w-full appearance-none rounded-md border border-border/60 bg-background/80 pl-7 pr-7 text-transparent outline-none transition-colors focus:border-foreground/40 text-xs'>
                            <option value={UNFILED_FOLDER_VALUE}>
                              Unsorted
                            </option>
                            {(folderOptions ?? []).map((folder) => (
                              <option
                                key={folder._id}
                                value={folder._id}
                                className='flex items-center gap-2'>
                                {folder.name}
                              </option>
                            ))}
                          </select>
                          <div className='pointer-events-none absolute inset-y-0 left-7 right-7 flex items-center'>
                            <span className='truncate text-[10px] text-muted-foreground sm:text-[11px]'>
                              {currentFolderLabel}
                            </span>
                          </div>
                          <Icon
                            name='chevron-down'
                            className='pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground'
                          />
                        </div>
                      ) : conversation.hasMessages ? (
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
                                  ? 'font-semibold tracking-tighter text-foreground'
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
                                  ? 'font-semibold tracking-tighter text-foreground'
                                  : 'opacity-60',
                              )}>
                              {imageAttachments.length}{' '}
                              {imageAttachments.length === 1
                                ? 'photo'
                                : 'photos'}
                            </span>
                          </div>
                        ) : (
                          <p
                            className={cn(
                              'truncate text-sm',
                              isUnread
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground',
                            )}>
                            {conversation.lastMessage.content}
                          </p>
                        )
                      ) : (
                        <p className='truncate text-sm italic text-muted-foreground/60'>
                          Start a conversation
                        </p>
                      )}
                    </div>
                    <div className='flex shrink-0 items-center justify-between gap-2 sm:justify-end'>
                      {isUnread && (
                        <span className='flex size-5 shrink-0 aspect-square items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white dark:text-white md:size-6'>
                          {conversation.unreadCount > 9
                            ? '9+'
                            : conversation.unreadCount}
                        </span>
                      )}
                      <div className='max-w-18 shrink-0 text-right text-[8px] font-normal text-muted-foreground sm:max-w-none font-ios tracking-tighter'>
                        {formatTimestamp(conversation.lastMessage.createdAt)}
                      </div>
                      {showFolderPicker &&
                        folderControlFid &&
                        onMoveConversation && (
                          <button
                            type='button'
                            aria-label={
                              isFolderEditorOpen
                                ? 'Close folder selector'
                                : `Move ${displayName} conversation to a folder`
                            }
                            onClick={(event) => {
                              event.stopPropagation()
                              setFolderEditorConversationId((current) =>
                                current === conversation.otherUserId
                                  ? null
                                  : conversation.otherUserId,
                              )
                            }}
                            className={cn(
                              'inline-flex w-3 h-4 shrink-0 items-center justify-center rounded-sm',
                              isFolderEditorOpen
                                ? 'text-foreground'
                                : 'bg-background/20 text-muted-foreground hover:text-foreground',
                            )}>
                            <Icon
                              name={isFolderEditorOpen ? 'x' : 'more-v'}
                              className='size-3'
                            />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
