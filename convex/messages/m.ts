import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import {mutation} from '../_generated/server'
import type {MutationCtx} from '../_generated/server'
import {
  buildGuestFid,
  GUEST_DISPLAY_NAME,
  getOrCreateGuestUser,
  getUserByGuestId,
  normalizeGuestId,
} from './guest'
import {resolveStaffChatUser} from '../staff/chat'

const normalizeFolderName = (value: string) =>
  value.trim().replace(/\s+/g, ' ').slice(0, 40)

const getUserByFid = async (ctx: MutationCtx, fid: string) =>
  ctx.db
    .query('users')
    .withIndex('by_fid', (q) => q.eq('fid', fid))
    .first()

const getRepresentativeFromStaff = async (
  ctx: MutationCtx,
  staffId: Id<'staff'>,
) => {
  const staff = await ctx.db.get(staffId)
  if (!staff?.active) {
    throw new Error('Default representative is not available')
  }

  return resolveStaffChatUser(ctx, staff)
}

const getGuestRepresentative = async (
  ctx: MutationCtx,
  guestUser: Doc<'users'> | null,
) => {
  if (guestUser?.guestRepresentativeId) {
    const existingRepresentative = await ctx.db.get(
      guestUser.guestRepresentativeId,
    )
    const existingRepresentativeFid =
      existingRepresentative?.fid ?? existingRepresentative?.firebaseId ?? null

    if (existingRepresentative && existingRepresentativeFid) {
      return {
        user: existingRepresentative,
        fid: existingRepresentativeFid,
      }
    }
  }

  const salesRepSetting = await ctx.db
    .query('adminSettings')
    .withIndex('by_identifier', (q) => q.eq('identifier', 'sales-rep'))
    .unique()

  const staffId =
    salesRepSetting?.value &&
    typeof salesRepSetting.value === 'object' &&
    'staffId' in salesRepSetting.value &&
    typeof salesRepSetting.value.staffId === 'string'
      ? salesRepSetting.value.staffId
      : null

  if (!staffId) {
    throw new Error('No default representative configured')
  }

  return getRepresentativeFromStaff(ctx, staffId as Id<'staff'>)
}

const ensureVisibleFollow = async (
  ctx: MutationCtx,
  followerId: Id<'users'>,
  followedId: Id<'users'>,
) => {
  if (followerId === followedId) {
    return null
  }

  const existingFollow = await ctx.db
    .query('follows')
    .withIndex('by_follower_followed', (q) =>
      q.eq('followerId', followerId).eq('followedId', followedId),
    )
    .first()

  if (existingFollow) {
    if (!existingFollow.visible) {
      await ctx.db.patch(existingFollow._id, {
        visible: true,
      })
    }

    return existingFollow._id
  }

  return ctx.db.insert('follows', {
    followerId,
    followedId,
    createdAt: new Date().toISOString(),
    visible: true,
  })
}

const clearArchivePair = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  otherUserId: Id<'users'>,
) => {
  const archivedConversation = await ctx.db
    .query('archivedConversations')
    .withIndex('by_userId_otherUserId', (q) =>
      q.eq('userId', userId).eq('otherUserId', otherUserId),
    )
    .first()

  if (archivedConversation) {
    await ctx.db.delete(archivedConversation._id)
  }
}

const remapLikes = (
  likes:
    | Array<{
        userId: Id<'users'>
        likedAt: string
      }>
    | undefined,
  guestUserId: Id<'users'>,
  userId: Id<'users'>,
) => {
  if (!likes?.length) {
    return likes
  }

  const mappedLikes = likes.map((like) =>
    like.userId === guestUserId ? {...like, userId} : like,
  )

  return mappedLikes.filter(
    (like, index) =>
      mappedLikes.findIndex((entry) => entry.userId === like.userId) === index,
  )
}

const getFolderOwner = async (ctx: MutationCtx, userfid: string) => {
  const user = await getUserByFid(ctx, userfid)

  if (!user) {
    throw new Error('User not found')
  }

  const staff = user.email
    ? await ctx.db
        .query('staff')
        .withIndex('by_email', (q) => q.eq('email', user.email))
        .unique()
    : null

  if (!staff?.active) {
    throw new Error('Only active staff can manage chat folders')
  }

  return user
}

const resolveOtherUserId = async (
  ctx: MutationCtx,
  otherUserfid: string,
  otherUserId?: string,
) => {
  const otherUser = await getUserByFid(ctx, otherUserfid)

  if (otherUser) {
    return otherUser._id
  }

  if (typeof otherUserId === 'string') {
    return otherUserId as Id<'users'>
  }

  throw new Error('Other user not found')
}

export const ensureGuestConversation = mutation({
  args: {
    guestId: v.string(),
  },
  handler: async (ctx, args) => {
    const guestId = normalizeGuestId(args.guestId)

    if (!guestId) {
      throw new Error('Guest id is required')
    }

    let guestUser = await getOrCreateGuestUser(ctx, guestId)
    const representative = await getGuestRepresentative(ctx, guestUser)

    if (guestUser.guestRepresentativeId !== representative.user._id) {
      await ctx.db.patch(guestUser._id, {
        guestRepresentativeId: representative.user._id,
        updatedAt: Date.now(),
      })

      guestUser = (await ctx.db.get(guestUser._id)) ?? guestUser
    }

    await ensureVisibleFollow(ctx, guestUser._id, representative.user._id)
    await clearArchivePair(ctx, guestUser._id, representative.user._id)
    await clearArchivePair(ctx, representative.user._id, guestUser._id)

    return {
      guestId,
      guestFid: guestUser.fid ?? buildGuestFid(guestId),
      representativeFid: representative.fid,
      representative: {
        name: representative.user.name ?? GUEST_DISPLAY_NAME,
        email: representative.user.email ?? '',
        photoUrl: representative.user.photoUrl ?? null,
      },
    }
  },
})

export const mergeGuestConversation = mutation({
  args: {
    guestId: v.string(),
    userFid: v.string(),
  },
  handler: async (ctx, args) => {
    const guestId = normalizeGuestId(args.guestId)

    if (!guestId) {
      return {merged: false}
    }

    const guestUser =
      (await getUserByGuestId(ctx, guestId)) ??
      (await getUserByFid(ctx, buildGuestFid(guestId)))

    if (!guestUser) {
      return {merged: false}
    }

    const user = await getUserByFid(ctx, args.userFid)
    if (!user) {
      throw new Error('Authenticated user not found')
    }

    if (guestUser._id === user._id) {
      return {merged: false}
    }

    const guestSentMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender', (q) => q.eq('senderId', guestUser._id))
      .collect()

    for (const message of guestSentMessages) {
      await ctx.db.patch(message._id, {
        senderId: user._id,
        likes: remapLikes(message.likes, guestUser._id, user._id),
      })
    }

    const guestReceivedMessages = await ctx.db
      .query('messages')
      .withIndex('by_receiver', (q) => q.eq('receiverId', guestUser._id))
      .collect()

    for (const message of guestReceivedMessages) {
      await ctx.db.patch(message._id, {
        receiverId: user._id,
        likes: remapLikes(message.likes, guestUser._id, user._id),
      })
    }

    const guestFollowing = await ctx.db
      .query('follows')
      .withIndex('by_follower', (q) => q.eq('followerId', guestUser._id))
      .collect()

    for (const follow of guestFollowing) {
      if (follow.followedId === user._id) {
        await ctx.db.delete(follow._id)
        continue
      }

      const existingFollow = await ctx.db
        .query('follows')
        .withIndex('by_follower_followed', (q) =>
          q.eq('followerId', user._id).eq('followedId', follow.followedId),
        )
        .first()

      if (existingFollow) {
        if (!existingFollow.visible && follow.visible) {
          await ctx.db.patch(existingFollow._id, {
            visible: true,
          })
        }
        await ctx.db.delete(follow._id)
        continue
      }

      await ctx.db.patch(follow._id, {
        followerId: user._id,
      })
    }

    const guestFollowers = await ctx.db
      .query('follows')
      .withIndex('by_followed', (q) => q.eq('followedId', guestUser._id))
      .collect()

    for (const follow of guestFollowers) {
      if (follow.followerId === user._id) {
        await ctx.db.delete(follow._id)
        continue
      }

      const existingFollow = await ctx.db
        .query('follows')
        .withIndex('by_follower_followed', (q) =>
          q.eq('followerId', follow.followerId).eq('followedId', user._id),
        )
        .first()

      if (existingFollow) {
        if (!existingFollow.visible && follow.visible) {
          await ctx.db.patch(existingFollow._id, {
            visible: true,
          })
        }
        await ctx.db.delete(follow._id)
        continue
      }

      await ctx.db.patch(follow._id, {
        followedId: user._id,
      })
    }

    const guestArchivedConversations = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId', (q) => q.eq('userId', guestUser._id))
      .collect()

    for (const archivedConversation of guestArchivedConversations) {
      if (archivedConversation.otherUserId === user._id) {
        await ctx.db.delete(archivedConversation._id)
        continue
      }

      const existingArchivedConversation = await ctx.db
        .query('archivedConversations')
        .withIndex('by_userId_otherUserId', (q) =>
          q
            .eq('userId', user._id)
            .eq('otherUserId', archivedConversation.otherUserId),
        )
        .first()

      if (existingArchivedConversation) {
        await ctx.db.delete(archivedConversation._id)
        continue
      }

      await ctx.db.patch(archivedConversation._id, {
        userId: user._id,
      })
    }

    const archivedConversationsReferencingGuest = await ctx.db
      .query('archivedConversations')
      .withIndex('by_otherUserId', (q) => q.eq('otherUserId', guestUser._id))
      .collect()

    for (const archivedConversation of archivedConversationsReferencingGuest) {
      if (archivedConversation.userId === user._id) {
        await ctx.db.delete(archivedConversation._id)
        continue
      }

      const existingArchivedConversation = await ctx.db
        .query('archivedConversations')
        .withIndex('by_userId_otherUserId', (q) =>
          q
            .eq('userId', archivedConversation.userId)
            .eq('otherUserId', user._id),
        )
        .first()

      if (existingArchivedConversation) {
        await ctx.db.delete(archivedConversation._id)
        continue
      }

      await ctx.db.patch(archivedConversation._id, {
        otherUserId: user._id,
      })
    }

    const guestOwnedAssignments = await ctx.db
      .query('conversationFolderAssignments')
      .withIndex('by_ownerUserId', (q) => q.eq('ownerUserId', guestUser._id))
      .collect()

    for (const assignment of guestOwnedAssignments) {
      await ctx.db.delete(assignment._id)
    }

    const assignmentsReferencingGuest = await ctx.db
      .query('conversationFolderAssignments')
      .withIndex('by_otherUserId', (q) => q.eq('otherUserId', guestUser._id))
      .collect()

    for (const assignment of assignmentsReferencingGuest) {
      if (assignment.ownerUserId === user._id) {
        await ctx.db.delete(assignment._id)
        continue
      }

      const existingAssignment = await ctx.db
        .query('conversationFolderAssignments')
        .withIndex('by_ownerUserId_otherUserId', (q) =>
          q
            .eq('ownerUserId', assignment.ownerUserId)
            .eq('otherUserId', user._id),
        )
        .first()

      if (existingAssignment) {
        await ctx.db.delete(assignment._id)
        continue
      }

      await ctx.db.patch(assignment._id, {
        otherUserId: user._id,
      })
    }

    const representativeUser = guestUser.guestRepresentativeId
      ? await ctx.db.get(guestUser.guestRepresentativeId)
      : null

    const guestChatOrders = await ctx.db
      .query('orders')
      .withIndex('by_chatUserId', (q) => q.eq('chatUserId', guestUser._id))
      .collect()

    for (const order of guestChatOrders) {
      await ctx.db.patch(order._id, {
        chatUserId: user._id,
        updatedAt: Date.now(),
      })
    }

    const guestOwnedOrders = await ctx.db
      .query('orders')
      .withIndex('by_user', (q) => q.eq('userId', guestUser._id))
      .collect()

    for (const order of guestOwnedOrders) {
      await ctx.db.patch(order._id, {
        userId: user._id,
        chatUserId: user._id,
        updatedAt: Date.now(),
      })
    }

    await ctx.db.delete(guestUser._id)

    return {
      merged: true,
      representativeFid:
        representativeUser?.fid ?? representativeUser?.firebaseId ?? null,
    }
  },
})

// Send a message to another user
export const sendMessage = mutation({
  args: {
    receiverId: v.string(), // The user to send the message to (Firebase UID)
    senderId: v.string(), // The current user's fid (Firebase UID)
    content: v.string(), // The message content
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id('_storage'),
          fileName: v.string(),
          fileType: v.string(),
          fileSize: v.number(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Validate content or attachments
    if (
      !args.content.trim() &&
      (!args.attachments || args.attachments.length === 0)
    ) {
      throw new Error('Message must have content or attachments')
    }

    // Get both users by fid
    const sender = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.senderId))
      .first()

    const receiver = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.receiverId))
      .first()

    if (!sender) {
      throw new Error('Sender user not found')
    }

    if (!receiver) {
      throw new Error('Receiver user not found')
    }

    // Prevent self-messaging
    if (sender._id === receiver._id) {
      throw new Error('Cannot send message to yourself')
    }

    // Check if users are connected (either follows the other)
    const follow1 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', sender._id).eq('followedId', receiver._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    const follow2 = await ctx.db
      .query('follows')
      .withIndex('by_follower_followed', (q) =>
        q.eq('followerId', receiver._id).eq('followedId', sender._id),
      )
      .filter((q) => q.eq(q.field('visible'), true))
      .first()

    if (!follow1 && !follow2) {
      throw new Error('Users must be connected to send messages')
    }

    // Get URLs for attachments
    const attachmentsWithUrls = args.attachments
      ? await Promise.all(
          args.attachments.map(async (attachment) => {
            const url = await ctx.storage.getUrl(attachment.storageId)
            return {
              ...attachment,
              url,
            }
          }),
        )
      : undefined

    // Create the message
    const messageId = await ctx.db.insert('messages', {
      senderId: sender._id,
      receiverId: receiver._id,
      content: args.content.trim() || '',
      createdAt: new Date().toISOString(),
      readAt: null,
      visible: true,
      attachments: attachmentsWithUrls,
      likes: [],
    })

    // Unarchive this conversation for both users so it reappears in their lists
    const senderArchived = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', sender._id).eq('otherUserId', receiver._id),
      )
      .first()
    if (senderArchived) {
      await ctx.db.delete(senderArchived._id)
    }
    const receiverArchived = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', receiver._id).eq('otherUserId', sender._id),
      )
      .first()
    if (receiverArchived) {
      await ctx.db.delete(receiverArchived._id)
    }

    // Push notify receiver (best-effort).
    const receiverProfile = await ctx.db.get('users', receiver._id)

    const tokens =
      receiverProfile?.fcm?.tokens?.filter((t) => t.length > 0) ?? []
    const token = receiverProfile?.fcm?.token
    const hasDeclined = receiverProfile?.fcm?.hasDeclined === true
    const sendTokens = tokens.length > 0 ? tokens : token ? [token] : []
    if (sendTokens.length > 0 && !hasDeclined) {
      const _senderName =
        sender.name ?? sender.email.split('@')[0] ?? 'New message'
      const _body =
        args.content.trim() ||
        (args.attachments?.length ? 'Sent an attachment' : 'New message')
      const _url = `/account/chat/${sender.fid}`

      // for (const token of sendTokens) {
      //   await ctx.scheduler.runAfter(0, api.push.a.sendToToken, {
      //     token,
      //     title: senderName,
      //     body,
      //     url,
      //   })
      // }
    }

    return messageId
  },
})

// Like a message
export const likeMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userfid: v.string(), // Current user's fid (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Get the user by fid
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Check if already liked
    const existingLikes = message.likes || []
    const alreadyLiked = existingLikes.some((like) => like.userId === user._id)

    if (alreadyLiked) {
      // Unlike: remove the like
      const updatedLikes = existingLikes.filter(
        (like) => like.userId !== user._id,
      )
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: false, likesCount: updatedLikes.length}
    } else {
      // Like: add the like
      const updatedLikes = [
        ...existingLikes,
        {
          userId: user._id,
          likedAt: new Date().toISOString(),
        },
      ]
      await ctx.db.patch(args.messageId, {
        likes: updatedLikes,
      })
      return {liked: true, likesCount: updatedLikes.length}
    }
  },
})

// Mark messages as read
export const markAsRead = mutation({
  args: {
    senderfid: v.string(), // The user who sent the messages (Firebase UID)
    receiverfid: v.string(), // The current user's fid (Firebase UID)
  },
  handler: async (ctx, args) => {
    // Get both users by fid
    const sender = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.senderfid))
      .first()

    const receiver = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.receiverfid))
      .first()

    if (!sender || !receiver) {
      throw new Error('User not found')
    }

    // Get all unread messages from sender to receiver
    const unreadMessages = await ctx.db
      .query('messages')
      .withIndex('by_sender_receiver', (q) =>
        q.eq('senderId', sender._id).eq('receiverId', receiver._id),
      )
      .filter((q) =>
        q.and(q.eq(q.field('visible'), true), q.eq(q.field('readAt'), null)),
      )
      .collect()

    // Mark all as read
    const readAt = new Date().toISOString()
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        readAt,
      })
    }

    return unreadMessages.length
  },
})

// Archive a conversation (hides it from the main list for the current user).
// When the other user no longer exists (e.g. deleted), pass otherUserId so we can still hide the conversation.
export const archiveConversation = mutation({
  args: {
    userfid: v.string(), // Current user's fid (Firebase UID)
    otherUserfid: v.string(), // Other participant's fid (Firebase UID)
    otherUserId: v.optional(v.string()), // Other participant's Convex user id (use when otherUser not found by fid)
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    const otherUser = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.otherUserfid))
      .first()

    const otherUserIdToArchive: Id<'users'> | null = otherUser
      ? otherUser._id
      : typeof args.otherUserId === 'string'
        ? (args.otherUserId as Id<'users'>)
        : null

    if (!otherUserIdToArchive) {
      throw new Error('Other user not found')
    }

    const existing = await ctx.db
      .query('archivedConversations')
      .withIndex('by_userId_otherUserId', (q) =>
        q.eq('userId', user._id).eq('otherUserId', otherUserIdToArchive),
      )
      .first()

    if (existing) {
      return existing._id
    }

    return await ctx.db.insert('archivedConversations', {
      userId: user._id,
      otherUserId: otherUserIdToArchive,
      archivedAt: new Date().toISOString(),
    })
  },
})

export const createConversationFolder = mutation({
  args: {
    userfid: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getFolderOwner(ctx, args.userfid)
    const name = normalizeFolderName(args.name)

    if (name.length < 2) {
      throw new Error('Folder name must be at least 2 characters')
    }

    const nameLower = name.toLowerCase()
    const existing = await ctx.db
      .query('conversationFolders')
      .withIndex('by_ownerUserId_nameLower', (q) =>
        q.eq('ownerUserId', user._id).eq('nameLower', nameLower),
      )
      .first()

    if (existing) {
      return existing._id
    }

    const now = new Date().toISOString()

    return await ctx.db.insert('conversationFolders', {
      ownerUserId: user._id,
      name,
      nameLower,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const renameConversationFolder = mutation({
  args: {
    userfid: v.string(),
    folderId: v.id('conversationFolders'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getFolderOwner(ctx, args.userfid)
    const folder = await ctx.db.get(args.folderId)

    if (!folder || folder.ownerUserId !== user._id) {
      throw new Error('Folder not found')
    }

    const name = normalizeFolderName(args.name)

    if (name.length < 2) {
      throw new Error('Folder name must be at least 2 characters')
    }

    const nameLower = name.toLowerCase()
    const existing = await ctx.db
      .query('conversationFolders')
      .withIndex('by_ownerUserId_nameLower', (q) =>
        q.eq('ownerUserId', user._id).eq('nameLower', nameLower),
      )
      .first()

    if (existing && existing._id !== folder._id) {
      throw new Error('Folder name already exists')
    }

    await ctx.db.patch(args.folderId, {
      name,
      nameLower,
      updatedAt: new Date().toISOString(),
    })

    return args.folderId
  },
})

export const setConversationFolder = mutation({
  args: {
    userfid: v.string(),
    otherUserfid: v.string(),
    otherUserId: v.optional(v.string()),
    folderId: v.union(v.id('conversationFolders'), v.null()),
  },
  handler: async (ctx, args) => {
    const user = await getFolderOwner(ctx, args.userfid)
    const targetOtherUserId = await resolveOtherUserId(
      ctx,
      args.otherUserfid,
      args.otherUserId,
    )

    const existingAssignment = await ctx.db
      .query('conversationFolderAssignments')
      .withIndex('by_ownerUserId_otherUserId', (q) =>
        q.eq('ownerUserId', user._id).eq('otherUserId', targetOtherUserId),
      )
      .first()

    if (args.folderId === null) {
      if (existingAssignment) {
        await ctx.db.delete(existingAssignment._id)
      }
      return null
    }

    const folder = await ctx.db.get(args.folderId)
    if (!folder || folder.ownerUserId !== user._id) {
      throw new Error('Folder not found')
    }

    const now = new Date().toISOString()

    if (existingAssignment) {
      await ctx.db.patch(existingAssignment._id, {
        folderId: args.folderId,
        assignedAt: now,
      })
      return existingAssignment._id
    }

    return await ctx.db.insert('conversationFolderAssignments', {
      ownerUserId: user._id,
      otherUserId: targetOtherUserId,
      folderId: args.folderId,
      assignedAt: now,
    })
  },
})

// Delete a message (soft delete by setting visible to false)
export const deleteMessage = mutation({
  args: {
    messageId: v.id('messages'),
    userfid: v.string(), // Current user's fid (Firebase UID) to verify ownership
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.db.get(args.messageId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Get the user by fid
    const user = await ctx.db
      .query('users')
      .withIndex('by_fid', (q) => q.eq('fid', args.userfid))
      .first()

    if (!user) {
      throw new Error('User not found')
    }

    // Only sender or receiver can delete the message
    if (message.senderId !== user._id && message.receiverId !== user._id) {
      throw new Error('Unauthorized to delete this message')
    }

    // Soft delete by setting visible to false
    await ctx.db.patch(args.messageId, {
      visible: false,
    })

    return args.messageId
  },
})
