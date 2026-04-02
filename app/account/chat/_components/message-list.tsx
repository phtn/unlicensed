'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import {Icon} from '@/lib/icons'
import {useMutation} from 'convex/react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {MessageGroup} from './message-group'
import {useGroupedMessages, useLastReadMessageId} from './message-list-hooks'
import {ImageModal} from './message-list-image-modal'
import type {Attachment, MessageListProps} from './message-list-types'
import {withViewTransitionAndTransition} from './message-list-utils'
import {ScrollToBottomButton} from './scroll-to-bottom-button'

export function MessageList({
  messages,
  currentUserProId,
  otherUserProId,
  onOptimisticLike,
  onOptimisticUnlike,
  scrollAreaRef,
  scrollButtonAnchorEl,
  onScrollToBottom,
}: MessageListProps) {
  const {user} = useAuthCtx()
  const likeMessage = useMutation(api.messages.m.likeMessage)
  const [clickedMessageId, setClickedMessageId] =
    useState<Id<'messages'> | null>(null)

  const [imageModal, setImageModal] = useState<{
    url: string
    fileName: string
  } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showLoader, setShowLoader] = useState(false)

  // Get user data for both users (fid = Firebase/auth UID)
  const {data: currentUserData} = useConvexSnapshotQuery(
    api.messages.q.getParticipantByFid,
    {
      fid: currentUserProId,
    },
  )
  const {data: otherUserData} = useConvexSnapshotQuery(
    api.messages.q.getParticipantByFid,
    {
      fid: otherUserProId,
    },
  )

  const currentUser = useMemo(
    () =>
      currentUserData
        ? {
            _id: currentUserData._id,
            displayName: currentUserData.name ?? null,
            email: currentUserData.email ?? '',
            avatarUrl: currentUserData.photoUrl ?? null,
          }
        : null,
    [currentUserData],
  )
  const otherUser = useMemo(
    () =>
      otherUserData
        ? {
            _id: otherUserData._id,
            displayName: otherUserData.name ?? null,
            email: otherUserData.email ?? '',
            avatarUrl: otherUserData.photoUrl ?? null,
          }
        : null,
    [otherUserData],
  )

  // Group messages and get last read message ID
  const groupedMessages = useGroupedMessages(messages)
  const lastReadMessageId = useLastReadMessageId(messages, currentUser)

  const openImageModal = useCallback((attachment: Attachment) => {
    if (!attachment.url) return
    const url = attachment.url
    withViewTransitionAndTransition(() => {
      setImageModal({url, fileName: attachment.fileName})
    })
  }, [])

  const closeImageModal = useCallback(() => {
    withViewTransitionAndTransition(() => {
      setImageModal(null)
    })
  }, [])

  useEffect(() => {
    if (!imageModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageModal()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [imageModal, closeImageModal])

  useEffect(() => {
    if (!messages) {
      const timer = setTimeout(() => {
        setShowLoader(true)
      }, 500)
      return () => {
        clearTimeout(timer)
      }
    }
    // Defer reset so setState runs in a callback, not synchronously in the effect
    queueMicrotask(() => setShowLoader(false))
    return undefined
  }, [messages])

  const handleLike = useCallback(
    async (messageId: Id<'messages'>) => {
      if (!user?.uid || !currentUser) return

      // Check if already liked for optimistic update
      const message = messages?.find((m) => m._id === messageId)
      const isLiked = message?.likes?.some(
        (like) => like.userId === currentUser._id,
      )

      // Optimistic update
      if (isLiked && onOptimisticUnlike) {
        // playSequence(['F4', 'C4'], '32n')
        onOptimisticUnlike(messageId, currentUser._id)
      } else if (!isLiked && onOptimisticLike) {
        // playSequence(['C4', 'G4'], '32n')
        onOptimisticLike(messageId, currentUser._id)
      }

      try {
        await likeMessage({
          messageId,
          userfid: user.uid,
        })
      } catch (error) {
        console.error('Error liking message:', error)
        // Revert optimistic update on error
        if (isLiked && onOptimisticLike) {
          onOptimisticLike(messageId, currentUser._id)
        } else if (!isLiked && onOptimisticUnlike) {
          onOptimisticUnlike(messageId, currentUser._id)
        }
      }
    },
    [
      user,
      currentUser,
      messages,
      onOptimisticLike,
      onOptimisticUnlike,
      // playSequence,
      likeMessage,
    ],
  )

  if (!currentUser) {
    return (
      <div className='flex h-full items-center justify-center'>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  if (!messages) {
    if (!showLoader) {
      return null
    }
    return (
      <div className='flex h-full items-center justify-center flex-col'>
        <Icon name='spinner-dots' className='text-primary-hover' />
        <p className='text-muted-foreground'>Loading messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center space-y-2'>
          <p className='text-muted-foreground font-medium'>No messages yet</p>
          <p className='text-sm text-muted-foreground'>
            Start the conversation!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Fullscreen Image Modal */}
      {imageModal && (
        <ImageModal
          url={imageModal.url}
          fileName={imageModal.fileName}
          isDownloading={isDownloading}
          setIsDownloading={setIsDownloading}
          onClose={closeImageModal}
        />
      )}

      {/* Message Groups */}
      {groupedMessages.map((group, groupIndex) => (
        <MessageGroup
          key={groupIndex}
          group={group}
          currentUser={currentUser}
          otherUser={otherUser}
          clickedMessageId={clickedMessageId}
          setClickedMessageId={setClickedMessageId}
          lastReadMessageId={lastReadMessageId}
          onImageClick={openImageModal}
          onLike={handleLike}
          setIsDownloading={setIsDownloading}
        />
      ))}

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
