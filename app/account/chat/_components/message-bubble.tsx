'use client'

import type {Id} from '@/convex/_generated/dataModel'
import {cn} from '@/lib/utils'
import {User} from '@heroui/react'
import {AudioMessagePlayer} from './audio-message-player'
import {MessageBubbleAttachments} from './message-bubble-attachments'
import {MessageBubbleTimestamp} from './message-bubble-timestamp'
import type {Attachment, Message} from './message-list-types'

interface User {
  _id: Id<'users'>
  displayName?: string | null
  email: string
  avatarUrl?: string | null
}

interface MessageBubbleProps {
  message: Message
  currentUser: User
  otherUser?: User | null
  clickedMessageId: Id<'messages'> | null
  setClickedMessageId: (id: Id<'messages'> | null) => void
  isLastRead?: boolean
  showAvatar: boolean
  isLastInGroup: boolean
  onImageClick: (attachment: Attachment) => void
  onLike: (messageId: Id<'messages'>) => void
  setIsDownloading: (value: boolean) => void
}

export function MessageBubble({
  message,
  currentUser,
  otherUser,
  clickedMessageId,
  setClickedMessageId,
  isLastRead,
  showAvatar,
  isLastInGroup,
  onImageClick,
  onLike,
  setIsDownloading,
}: MessageBubbleProps) {
  const isCurrentUser = message.senderId === currentUser._id
  const displayUser = isCurrentUser ? currentUser : otherUser
  const displayName =
    displayUser?.displayName || displayUser?.email || 'Unknown User'
  const initials = displayName[0]?.toUpperCase() || 'U'

  const isLiked = message.likes?.some((like) => like.userId === currentUser._id)
  const likesCount = message.likes?.length || 0

  const audioAttachments = message.attachments?.filter((a) =>
    a.fileType.startsWith('audio/'),
  )
  const nonAudioAttachments = message.attachments?.filter(
    (a) => !a.fileType.startsWith('audio/'),
  )

  // Audio-only if: has audio attachments, content is empty or contains only duration (numeric), and no other attachments
  const contentIsDurationOnly =
    !message.content ||
    (message.content && /^\d+$/.test(message.content.trim()))
  const isAudioOnly =
    audioAttachments &&
    audioAttachments.length > 0 &&
    contentIsDurationOnly &&
    (!nonAudioAttachments || nonAudioAttachments.length === 0)

  const isAttachmentOnly =
    nonAudioAttachments &&
    nonAudioAttachments.length > 0 &&
    !message.content &&
    (!audioAttachments || audioAttachments.length === 0)

  const isTimestampVisible = clickedMessageId === message._id

  const handleToggleTimestamp = () => {
    if (clickedMessageId === message._id) {
      setClickedMessageId(null)
    } else {
      setClickedMessageId(message._id)
    }
  }

  return (
    <div
      className={cn(
        'flex gap-2 items-end relative',
        isCurrentUser && 'flex-row-reverse',
      )}>
      {/* Avatar - only show for first message in a group */}
      <div className='w-7 md:w-8 shrink-0'>
        {showAvatar && displayUser ? (
          <User
            avatarProps={{
              src: displayUser.avatarUrl ?? '',
              fallback: initials,
            }}
            description={<span>Ask me anything</span>}
            name={displayName}
          />
        ) : null}
      </div>

      {/* Message Bubble */}
      {isAudioOnly && audioAttachments ? (
        <div
          className={cn(
            'flex flex-col gap-1 max-w-[75%] md:max-w-[70%]',
            isCurrentUser && 'items-end',
            !isCurrentUser && 'items-start',
          )}>
          <div onClick={handleToggleTimestamp}>
            {audioAttachments.map(
              (attachment, idx) =>
                attachment.url && (
                  <AudioMessagePlayer
                    key={idx}
                    url={attachment.url}
                    fileName={attachment.fileName}
                    isCurrentUser={isCurrentUser}
                  />
                ),
            )}
          </div>
          <MessageBubbleTimestamp
            messageId={message._id}
            createdAt={message.createdAt}
            isCurrentUser={isCurrentUser}
            isVisible={isTimestampVisible}
            isLastRead={isLastRead && isCurrentUser}
            otherUser={otherUser}
          />
        </div>
      ) : isAttachmentOnly && nonAudioAttachments ? (
        <div
          className={cn(
            'flex flex-col gap-1 max-w-[75%] md:max-w-[70%]',
            isCurrentUser && 'items-end',
            !isCurrentUser && 'items-start',
          )}>
          <div onClick={handleToggleTimestamp} className='cursor-pointer'>
            <MessageBubbleAttachments
              attachments={nonAudioAttachments}
              onImageClick={onImageClick}
              setIsDownloading={setIsDownloading}
              variant='standalone'
            />
          </div>
          <MessageBubbleTimestamp
            messageId={message._id}
            createdAt={message.createdAt}
            isCurrentUser={isCurrentUser}
            isVisible={isTimestampVisible}
            isLastRead={isLastRead && isCurrentUser}
            otherUser={otherUser}
            isLiked={isLiked}
            likesCount={likesCount}
            onLike={() => onLike(message._id)}
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-1 max-w-[75%] md:max-w-[70%]',
            isCurrentUser && 'items-end',
            !isCurrentUser && 'items-start',
          )}>
          <div
            onClick={handleToggleTimestamp}
            className={cn(
              'rounded-2xl px-3 md:px-4 py-2 shadow-sm cursor-pointer',
              isCurrentUser
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-muted text-foreground rounded-tl-sm',
              isLastInGroup &&
                (isCurrentUser ? 'rounded-br-2xl' : 'rounded-bl-2xl'),
            )}>
            {/* Attachments (non-audio) */}
            {nonAudioAttachments && nonAudioAttachments.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-2'>
                <MessageBubbleAttachments
                  attachments={nonAudioAttachments}
                  onImageClick={onImageClick}
                  setIsDownloading={setIsDownloading}
                />
              </div>
            )}

            {/* Message Text */}
            {message.content && (
              <p className='text-sm md:text-base leading-relaxed whitespace-pre-wrap wrap-break-words'>
                {message.content}
              </p>
            )}
          </div>
          <MessageBubbleTimestamp
            messageId={message._id}
            createdAt={message.createdAt}
            isCurrentUser={isCurrentUser}
            isVisible={isTimestampVisible}
            isLastRead={isLastRead && isCurrentUser}
            otherUser={otherUser}
            isLiked={isLiked}
            likesCount={likesCount}
            onLike={() => onLike(message._id)}
          />
        </div>
      )}
    </div>
  )
}
