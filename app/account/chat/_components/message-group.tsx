'use client'

import type {Id} from '@/convex/_generated/dataModel'
import {formatDateFn} from '@/utils/date'
import {MessageBubble} from './message-bubble'
import type {
  Attachment,
  MessageGroup as MessageGroupType,
} from './message-list-types'

interface User {
  _id: Id<'users'>
  displayName?: string | null
  email: string
  avatarUrl?: string | null
}

interface MessageGroupProps {
  group: MessageGroupType
  currentUser: User
  otherUser?: User | null
  clickedMessageId: Id<'messages'> | null
  setClickedMessageId: (id: Id<'messages'> | null) => void
  lastReadMessageId: Id<'messages'> | null
  onImageClick: (attachment: Attachment) => void
  onLike: (messageId: Id<'messages'>) => void
  setIsDownloading: (value: boolean) => void
}

export function MessageGroup({
  group,
  currentUser,
  otherUser,
  clickedMessageId,
  setClickedMessageId,
  lastReadMessageId,
  onImageClick,
  onLike,
  setIsDownloading,
}: MessageGroupProps) {
  return (
    <div className='space-y-3 md:space-y-4'>
      {/* Date Separator */}
      <div className='flex items-center justify-center'>
        <div className='px-2 md:px-3 py-1 rounded-full bg-muted/50 text-xs font-medium text-muted-foreground'>
          {formatDateFn(group.date)}
        </div>
      </div>

      {/* Messages in this group */}
      {group.messages.map((message, messageIndex) => {
        const prevMessage =
          messageIndex > 0 ? group.messages[messageIndex - 1] : null
        const nextMessage =
          messageIndex < group.messages.length - 1
            ? group.messages[messageIndex + 1]
            : null
        const showAvatar =
          !prevMessage || prevMessage.senderId !== message.senderId
        const isLastInGroup =
          !nextMessage || nextMessage.senderId !== message.senderId

        return (
          <MessageBubble
            key={message._id}
            message={message}
            currentUser={currentUser}
            otherUser={otherUser}
            clickedMessageId={clickedMessageId}
            setClickedMessageId={setClickedMessageId}
            isLastRead={lastReadMessageId === message._id}
            showAvatar={showAvatar}
            isLastInGroup={isLastInGroup}
            onImageClick={onImageClick}
            onLike={onLike}
            setIsDownloading={setIsDownloading}
          />
        )
      })}
    </div>
  )
}
