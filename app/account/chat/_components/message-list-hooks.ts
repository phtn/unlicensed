import type {Id} from '@/convex/_generated/dataModel'
import {useMemo} from 'react'
import type {Message, MessageGroup} from './message-list-types'

interface User {
  _id: Id<'users'>
  displayName?: string | null
  email: string
  avatarUrl?: string | null
}

export function useGroupedMessages(
  messages: Message[] | undefined,
): MessageGroup[] {
  return useMemo(() => {
    if (!messages || messages.length === 0) return []

    const groups: MessageGroup[] = []

    let currentDate = ''
    let currentGroup: Message[] = []

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

      // Add last group
      if (index === messages.length - 1) {
        groups.push({date: currentDate, messages: currentGroup})
      }
    })

    return groups
  }, [messages])
}

export function useLastReadMessageId(
  messages: Message[] | undefined,
  currentUser: User | null | undefined,
): Id<'messages'> | null {
  return useMemo(() => {
    if (!messages || !currentUser || messages.length === 0) return null

    // Find the chronologically last message (most recent)
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    const lastMessage = sortedMessages[sortedMessages.length - 1]
    const lastMessageIsFromRecipient = lastMessage.senderId !== currentUser._id

    // If the last message is from the recipient, don't show read avatar
    if (lastMessageIsFromRecipient) return null

    // Get all messages sent by current user, sorted by creation time
    const currentUserMessages = messages
      .filter((msg) => msg.senderId === currentUser._id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )

    // Find the last message that was read
    for (let i = currentUserMessages.length - 1; i >= 0; i--) {
      if (currentUserMessages[i].readAt) {
        return currentUserMessages[i]._id
      }
    }

    return null
  }, [messages, currentUser])
}
