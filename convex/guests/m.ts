import {v} from 'convex/values'
import {mutation} from '../_generated/server'
import {getGuestByFid} from './lib'

export const updateLocation = mutation({
  args: {
    fid: v.string(),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    city: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    source: v.union(
      v.literal('browser'),
      v.literal('header'),
      v.literal('ip'),
      v.literal('unknown'),
    ),
  },
  handler: async (ctx, args) => {
    const guest = await getGuestByFid(ctx, args.fid)

    if (!guest) {
      return null
    }

    await ctx.db.patch(guest._id, {
      ...(args.country !== undefined ? {country: args.country} : {}),
      ...(args.countryCode !== undefined
        ? {countryCode: args.countryCode}
        : {}),
      ...(args.city !== undefined ? {city: args.city} : {}),
      ...(args.latitude !== undefined ? {latitude: args.latitude} : {}),
      ...(args.longitude !== undefined ? {longitude: args.longitude} : {}),
      locationSource: args.source,
      locationUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    })

    return guest._id
  },
})
