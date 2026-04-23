import {Infer, v} from 'convex/values'

export const guestTrackingEventTypeSchema = v.union(
  v.literal('page_view'),
  v.literal('identify'),
  v.literal('cart_action'),
  v.literal('checkout_step'),
  v.literal('search'),
  v.literal('custom'),
)

export const guestTrackingDeviceTypeSchema = v.union(
  v.literal('desktop'),
  v.literal('mobile'),
  v.literal('tablet'),
  v.literal('unknown'),
)

export const guestTrackingConsentSchema = v.union(
  v.literal('unknown'),
  v.literal('granted'),
  v.literal('denied'),
)

const eventMetadataValueSchema = v.union(
  v.string(),
  v.number(),
  v.boolean(),
  v.null(),
)

export const guestTrackingMetadataSchema = v.record(
  v.string(),
  eventMetadataValueSchema,
)

export const guestVisitorSchema = v.object({
  visitorId: v.string(),
  firstSeenAt: v.number(),
  lastSeenAt: v.number(),
  pageViewCount: v.number(),
  eventCount: v.number(),
  firstPath: v.optional(v.string()),
  lastPath: v.optional(v.string()),
  landingUrl: v.optional(v.string()),
  lastUrl: v.optional(v.string()),
  firstReferrer: v.optional(v.string()),
  lastReferrer: v.optional(v.string()),
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  utmTerm: v.optional(v.string()),
  utmContent: v.optional(v.string()),
  deviceType: v.optional(guestTrackingDeviceTypeSchema),
  browser: v.optional(v.string()),
  os: v.optional(v.string()),
  screenWidth: v.optional(v.number()),
  screenHeight: v.optional(v.number()),
  timezone: v.optional(v.string()),
  locale: v.optional(v.string()),
  country: v.optional(v.string()),
  region: v.optional(v.string()),
  city: v.optional(v.string()),
  ipNetworkHash: v.optional(v.string()),
  userAgentHash: v.optional(v.string()),
  clientHintsHash: v.optional(v.string()),
  linkedUserFid: v.optional(v.string()),
  linkedAt: v.optional(v.number()),
  consent: v.optional(guestTrackingConsentSchema),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const guestVisitorEventSchema = v.object({
  visitorId: v.string(),
  type: guestTrackingEventTypeSchema,
  path: v.string(),
  fullPath: v.optional(v.string()),
  title: v.optional(v.string()),
  referrer: v.optional(v.string()),
  utmSource: v.optional(v.string()),
  utmMedium: v.optional(v.string()),
  utmCampaign: v.optional(v.string()),
  utmTerm: v.optional(v.string()),
  utmContent: v.optional(v.string()),
  deviceType: v.optional(guestTrackingDeviceTypeSchema),
  browser: v.optional(v.string()),
  os: v.optional(v.string()),
  screenWidth: v.optional(v.number()),
  screenHeight: v.optional(v.number()),
  timezone: v.optional(v.string()),
  locale: v.optional(v.string()),
  country: v.optional(v.string()),
  region: v.optional(v.string()),
  city: v.optional(v.string()),
  ipNetworkHash: v.optional(v.string()),
  userAgentHash: v.optional(v.string()),
  clientHintsHash: v.optional(v.string()),
  linkedUserFid: v.optional(v.string()),
  consent: v.optional(guestTrackingConsentSchema),
  metadata: v.optional(guestTrackingMetadataSchema),
  createdAt: v.number(),
})

export type GuestTrackingEventType = Infer<typeof guestTrackingEventTypeSchema>
export type GuestTrackingDeviceType = Infer<
  typeof guestTrackingDeviceTypeSchema
>
export type GuestTrackingConsent = Infer<typeof guestTrackingConsentSchema>
export type GuestTrackingMetadata = Infer<typeof guestTrackingMetadataSchema>
export type GuestVisitor = Infer<typeof guestVisitorSchema>
export type GuestVisitorEvent = Infer<typeof guestVisitorEventSchema>
