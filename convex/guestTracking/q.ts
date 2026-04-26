import {ConvexError, v} from 'convex/values'
import type {Doc} from '../_generated/dataModel'
import type {QueryCtx} from '../_generated/server'
import {query} from '../_generated/server'
import {isUnitedStatesCountry, normalizeUsState} from '../geo/lib'
import {
  getChatParticipantDisplayName,
  getChatParticipantFid,
  isGuestParticipant,
  type ChatParticipantDoc,
} from '../messages/participants'
import {findStaffByEmail, hasAdminAccessRole} from '../staff/lib'
import {getCanonicalUserByFid} from '../users/lib'
import {guestTrackingEventTypeSchema} from './d'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500
const DEFAULT_STATS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const DEFAULT_GEO_LIMIT = 5000
const MAX_GEO_LIMIT = 10000

async function requireAdminAccess(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  const email = identity?.email?.trim().toLowerCase()

  if (!email) {
    throw new ConvexError('Unauthorized')
  }

  const staff = await findStaffByEmail(ctx, email)
  if (!staff?.active || !hasAdminAccessRole(staff.accessRoles)) {
    throw new ConvexError('Forbidden')
  }
}

const clampLimit = (limit: number | undefined) =>
  Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT)

const clampGeoLimit = (limit: number | undefined) =>
  Math.min(Math.max(limit ?? DEFAULT_GEO_LIMIT, 1), MAX_GEO_LIMIT)

const findGuestForVisitor = async (
  ctx: QueryCtx,
  visitor: Doc<'guestVisitors'>,
) => {
  if (visitor.deviceFingerprintId) {
    const guest = await ctx.db
      .query('guests')
      .withIndex('by_device_fingerprint_id', (q) =>
        q.eq('deviceFingerprintId', visitor.deviceFingerprintId),
      )
      .first()

    if (guest) {
      return guest
    }
  }

  return await ctx.db
    .query('guests')
    .withIndex('by_visitor_id', (q) => q.eq('visitorId', visitor.visitorId))
    .first()
}

const resolveVisitorChatParticipant = async (
  ctx: QueryCtx,
  visitor: Doc<'guestVisitors'>,
): Promise<ChatParticipantDoc | null> => {
  if (visitor.linkedUserFid) {
    const user = await getCanonicalUserByFid(ctx, visitor.linkedUserFid)
    if (user) {
      return user
    }
  }

  return await findGuestForVisitor(ctx, visitor)
}

export const getRecentVisitors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx)

    const visitors = await ctx.db
      .query('guestVisitors')
      .withIndex('by_last_seen_at')
      .order('desc')
      .take(clampLimit(args.limit))

    return await Promise.all(
      visitors.map(async (visitor) => {
        const participant = await resolveVisitorChatParticipant(ctx, visitor)
        const participantFid = participant
          ? getChatParticipantFid(participant)
          : null

        return {
          ...visitor,
          chatParticipantId: participant?._id ?? null,
          chatParticipantFid: participantFid || null,
          chatParticipantType: participant
            ? isGuestParticipant(participant)
              ? 'guest'
              : 'user'
            : null,
          chatDisplayName: participant
            ? getChatParticipantDisplayName(participant)
            : null,
        }
      }),
    )
  },
})

export const getRecentEvents = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(guestTrackingEventTypeSchema),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx)

    const limit = clampLimit(args.limit)

    const visitorId = args.visitorId
    if (visitorId) {
      return await ctx.db
        .query('guestVisitorEvents')
        .withIndex('by_visitor_id_and_created_at', (q) =>
          q.eq('visitorId', visitorId),
        )
        .order('desc')
        .take(limit)
    }

    const eventType = args.type
    if (eventType) {
      return await ctx.db
        .query('guestVisitorEvents')
        .withIndex('by_type_and_created_at', (q) => q.eq('type', eventType))
        .order('desc')
        .take(limit)
    }

    return await ctx.db
      .query('guestVisitorEvents')
      .withIndex('by_created_at')
      .order('desc')
      .take(limit)
  },
})

export const getVisitorStats = query({
  args: {
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx)

    const since = args.since ?? Date.now() - DEFAULT_STATS_WINDOW_MS
    const events = await ctx.db
      .query('guestVisitorEvents')
      .withIndex('by_created_at')
      .order('desc')
      .take(clampLimit(args.limit))
    const recentEvents = events.filter((event) => event.createdAt >= since)
    const visitorIds = new Set(recentEvents.map((event) => event.visitorId))
    const identifiedVisitorIds = new Set(
      recentEvents
        .filter((event) => Boolean(event.linkedUserFid))
        .map((event) => event.visitorId),
    )

    const pageViewsByPath: Record<string, number> = {}
    const eventsByType: Record<string, number> = {}
    const visitsByDevice: Record<string, number> = {}
    const visitsByCountry: Record<string, number> = {}

    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] ?? 0) + 1

      if (event.type === 'page_view') {
        pageViewsByPath[event.path] = (pageViewsByPath[event.path] ?? 0) + 1
      }

      const deviceType = event.deviceType ?? 'unknown'
      visitsByDevice[deviceType] = (visitsByDevice[deviceType] ?? 0) + 1

      if (event.country) {
        visitsByCountry[event.country] =
          (visitsByCountry[event.country] ?? 0) + 1
      }
    }

    return {
      totalEvents: recentEvents.length,
      totalPageViews: eventsByType.page_view ?? 0,
      uniqueVisitors: visitorIds.size,
      identifiedVisitors: identifiedVisitorIds.size,
      pageViewsByPath,
      eventsByType,
      visitsByDevice,
      visitsByCountry,
    }
  },
})

export const getVisitorGeoStats = query({
  args: {
    since: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx)

    const since = args.since ?? Date.now() - DEFAULT_STATS_WINDOW_MS
    const pageViewEvents = await ctx.db
      .query('guestVisitorEvents')
      .withIndex('by_type_and_created_at', (q) => q.eq('type', 'page_view'))
      .order('desc')
      .take(clampGeoLimit(args.limit))

    const recentPageViewEvents = pageViewEvents.filter(
      (event) => event.createdAt >= since,
    )
    const visitsByUsState: Record<string, number> = {}
    let totalUnitedStatesVisits = 0

    for (const event of recentPageViewEvents) {
      if (!isUnitedStatesCountry(event.country)) {
        continue
      }

      totalUnitedStatesVisits += 1

      const stateName = normalizeUsState(event.region || event.city)
      if (!stateName) {
        continue
      }

      visitsByUsState[stateName] = (visitsByUsState[stateName] ?? 0) + 1
    }

    return {
      totalUnitedStatesVisits,
      visitsByUsState,
    }
  },
})
