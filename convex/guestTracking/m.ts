import {ConvexError, v} from 'convex/values'
import {mutation} from '../_generated/server'
import {
  guestTrackingConsentSchema,
  guestTrackingDeviceTypeSchema,
  guestTrackingEventTypeSchema,
  guestTrackingMetadataSchema,
} from './d'

const MAX_STRING_LENGTH = 1000
const DEDUPE_WINDOW_MS = 2500

const stringArg = v.optional(v.string())

const normalizeVisitorId = (visitorId: string) => {
  const normalized = visitorId.trim()
  return normalized.length >= 12 && normalized.length <= 128 ? normalized : null
}

const trimValue = (
  value: string | undefined,
  maxLength = MAX_STRING_LENGTH,
) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed.slice(0, maxLength) : undefined
}

export const recordEvent = mutation({
  args: {
    visitorId: v.string(),
    type: guestTrackingEventTypeSchema,
    path: v.string(),
    fullPath: stringArg,
    title: stringArg,
    referrer: stringArg,
    utmSource: stringArg,
    utmMedium: stringArg,
    utmCampaign: stringArg,
    utmTerm: stringArg,
    utmContent: stringArg,
    deviceType: v.optional(guestTrackingDeviceTypeSchema),
    browser: stringArg,
    os: stringArg,
    screenWidth: v.optional(v.number()),
    screenHeight: v.optional(v.number()),
    timezone: stringArg,
    locale: stringArg,
    country: stringArg,
    region: stringArg,
    city: stringArg,
    ipNetworkHash: stringArg,
    userAgentHash: stringArg,
    clientHintsHash: stringArg,
    linkedUserFid: stringArg,
    consent: v.optional(guestTrackingConsentSchema),
    metadata: v.optional(guestTrackingMetadataSchema),
  },
  handler: async (ctx, args) => {
    const visitorId = normalizeVisitorId(args.visitorId)
    if (!visitorId) {
      throw new ConvexError('Invalid guest visitor identifier.')
    }

    const now = Date.now()
    const path = trimValue(args.path, 500) ?? '/'
    const fullPath = trimValue(args.fullPath)
    const linkedUserFid = trimValue(args.linkedUserFid, 256)

    const latestEvents = await ctx.db
      .query('guestVisitorEvents')
      .withIndex('by_visitor_id_and_created_at', (q) =>
        q.eq('visitorId', visitorId),
      )
      .order('desc')
      .take(1)
    const latestEvent = latestEvents[0]
    const isDuplicatePageView =
      args.type === 'page_view' &&
      latestEvent?.type === 'page_view' &&
      latestEvent.path === path &&
      now - latestEvent.createdAt < DEDUPE_WINDOW_MS

    const existingVisitor = await ctx.db
      .query('guestVisitors')
      .withIndex('by_visitor_id', (q) => q.eq('visitorId', visitorId))
      .unique()

    const visitorPatch = {
      lastSeenAt: now,
      updatedAt: now,
      lastPath: path,
      ...(fullPath ? {lastUrl: fullPath} : {}),
      ...(trimValue(args.referrer)
        ? {lastReferrer: trimValue(args.referrer)}
        : {}),
      ...(trimValue(args.utmSource, 200)
        ? {utmSource: trimValue(args.utmSource, 200)}
        : {}),
      ...(trimValue(args.utmMedium, 200)
        ? {utmMedium: trimValue(args.utmMedium, 200)}
        : {}),
      ...(trimValue(args.utmCampaign, 200)
        ? {utmCampaign: trimValue(args.utmCampaign, 200)}
        : {}),
      ...(trimValue(args.utmTerm, 200)
        ? {utmTerm: trimValue(args.utmTerm, 200)}
        : {}),
      ...(trimValue(args.utmContent, 200)
        ? {utmContent: trimValue(args.utmContent, 200)}
        : {}),
      ...(args.deviceType ? {deviceType: args.deviceType} : {}),
      ...(trimValue(args.browser, 120)
        ? {browser: trimValue(args.browser, 120)}
        : {}),
      ...(trimValue(args.os, 120) ? {os: trimValue(args.os, 120)} : {}),
      ...(args.screenWidth !== undefined
        ? {screenWidth: args.screenWidth}
        : {}),
      ...(args.screenHeight !== undefined
        ? {screenHeight: args.screenHeight}
        : {}),
      ...(trimValue(args.timezone, 120)
        ? {timezone: trimValue(args.timezone, 120)}
        : {}),
      ...(trimValue(args.locale, 80)
        ? {locale: trimValue(args.locale, 80)}
        : {}),
      ...(trimValue(args.country, 120)
        ? {country: trimValue(args.country, 120)}
        : {}),
      ...(trimValue(args.region, 120)
        ? {region: trimValue(args.region, 120)}
        : {}),
      ...(trimValue(args.city, 120) ? {city: trimValue(args.city, 120)} : {}),
      ...(trimValue(args.ipNetworkHash, 128)
        ? {ipNetworkHash: trimValue(args.ipNetworkHash, 128)}
        : {}),
      ...(trimValue(args.userAgentHash, 128)
        ? {userAgentHash: trimValue(args.userAgentHash, 128)}
        : {}),
      ...(trimValue(args.clientHintsHash, 128)
        ? {clientHintsHash: trimValue(args.clientHintsHash, 128)}
        : {}),
      ...(linkedUserFid ? {linkedUserFid, linkedAt: now} : {}),
      ...(args.consent ? {consent: args.consent} : {}),
    }

    const visitorDocumentId = existingVisitor
      ? existingVisitor._id
      : await ctx.db.insert('guestVisitors', {
          visitorId,
          firstSeenAt: now,
          pageViewCount: 0,
          eventCount: 0,
          firstPath: path,
          ...(fullPath ? {landingUrl: fullPath} : {}),
          ...(trimValue(args.referrer)
            ? {firstReferrer: trimValue(args.referrer)}
            : {}),
          ...visitorPatch,
          createdAt: now,
        })

    if (existingVisitor) {
      await ctx.db.patch(visitorDocumentId, {
        ...visitorPatch,
        eventCount: existingVisitor.eventCount + (isDuplicatePageView ? 0 : 1),
        pageViewCount:
          existingVisitor.pageViewCount +
          (args.type === 'page_view' && !isDuplicatePageView ? 1 : 0),
      })
    } else if (!isDuplicatePageView) {
      await ctx.db.patch(visitorDocumentId, {
        eventCount: 1,
        pageViewCount: args.type === 'page_view' ? 1 : 0,
      })
    }

    if (isDuplicatePageView) {
      return {
        visitorId,
        visitorDocumentId,
        eventDocumentId: latestEvent._id,
        deduped: true,
      }
    }

    const eventDocumentId = await ctx.db.insert('guestVisitorEvents', {
      visitorId,
      type: args.type,
      path,
      ...(fullPath ? {fullPath} : {}),
      ...(trimValue(args.title, 200)
        ? {title: trimValue(args.title, 200)}
        : {}),
      ...(trimValue(args.referrer) ? {referrer: trimValue(args.referrer)} : {}),
      ...(trimValue(args.utmSource, 200)
        ? {utmSource: trimValue(args.utmSource, 200)}
        : {}),
      ...(trimValue(args.utmMedium, 200)
        ? {utmMedium: trimValue(args.utmMedium, 200)}
        : {}),
      ...(trimValue(args.utmCampaign, 200)
        ? {utmCampaign: trimValue(args.utmCampaign, 200)}
        : {}),
      ...(trimValue(args.utmTerm, 200)
        ? {utmTerm: trimValue(args.utmTerm, 200)}
        : {}),
      ...(trimValue(args.utmContent, 200)
        ? {utmContent: trimValue(args.utmContent, 200)}
        : {}),
      ...(args.deviceType ? {deviceType: args.deviceType} : {}),
      ...(trimValue(args.browser, 120)
        ? {browser: trimValue(args.browser, 120)}
        : {}),
      ...(trimValue(args.os, 120) ? {os: trimValue(args.os, 120)} : {}),
      ...(args.screenWidth !== undefined
        ? {screenWidth: args.screenWidth}
        : {}),
      ...(args.screenHeight !== undefined
        ? {screenHeight: args.screenHeight}
        : {}),
      ...(trimValue(args.timezone, 120)
        ? {timezone: trimValue(args.timezone, 120)}
        : {}),
      ...(trimValue(args.locale, 80)
        ? {locale: trimValue(args.locale, 80)}
        : {}),
      ...(trimValue(args.country, 120)
        ? {country: trimValue(args.country, 120)}
        : {}),
      ...(trimValue(args.region, 120)
        ? {region: trimValue(args.region, 120)}
        : {}),
      ...(trimValue(args.city, 120) ? {city: trimValue(args.city, 120)} : {}),
      ...(trimValue(args.ipNetworkHash, 128)
        ? {ipNetworkHash: trimValue(args.ipNetworkHash, 128)}
        : {}),
      ...(trimValue(args.userAgentHash, 128)
        ? {userAgentHash: trimValue(args.userAgentHash, 128)}
        : {}),
      ...(trimValue(args.clientHintsHash, 128)
        ? {clientHintsHash: trimValue(args.clientHintsHash, 128)}
        : {}),
      ...(linkedUserFid ? {linkedUserFid} : {}),
      ...(args.consent ? {consent: args.consent} : {}),
      ...(args.metadata ? {metadata: args.metadata} : {}),
      createdAt: now,
    })

    return {
      visitorId,
      visitorDocumentId,
      eventDocumentId,
      deduped: false,
    }
  },
})
