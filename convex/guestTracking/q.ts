import {ConvexError, v} from 'convex/values'
import type {QueryCtx} from '../_generated/server'
import {query} from '../_generated/server'
import {findStaffByEmail, hasAdminAccessRole} from '../staff/lib'
import {guestTrackingEventTypeSchema} from './d'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500
const DEFAULT_STATS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

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

export const getRecentVisitors = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdminAccess(ctx)

    return await ctx.db
      .query('guestVisitors')
      .withIndex('by_last_seen_at')
      .order('desc')
      .take(clampLimit(args.limit))
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
