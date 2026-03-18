import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {query} from '../_generated/server'
import {getGuestByFid, getGuestByGuestId} from './lib'

export const getById = query({
  args: {
    id: v.id('guests'),
  },
  handler: async (ctx, args) => ctx.db.get(args.id),
})

export const getByFid = query({
  args: {
    fid: v.string(),
  },
  handler: async (ctx, args) => getGuestByFid(ctx, args.fid),
})

export const getByGuestId = query({
  args: {
    guestId: v.string(),
  },
  handler: async (ctx, args) => getGuestByGuestId(ctx, args.guestId),
})

export const resolveGuestReference = query({
  args: {
    reference: v.string(),
  },
  handler: async (ctx, args) => {
    const reference = args.reference.trim()

    if (!reference) {
      return null
    }

    const byFid = await getGuestByFid(ctx, reference)
    if (byFid) {
      return byFid
    }

    const byGuestId = await getGuestByGuestId(ctx, reference)
    if (byGuestId) {
      return byGuestId
    }

    return await ctx.db.get(reference as Id<'guests'>)
  },
})

export const getAllGuests = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100
    const guests = await ctx.db.query('guests').collect()

    const sorted = guests.sort((a, b) => {
      const leftTime = a.updatedAt ?? a.createdAt ?? a._creationTime
      const rightTime = b.updatedAt ?? b.createdAt ?? b._creationTime

      if (leftTime !== rightTime) {
        return rightTime - leftTime
      }

      return (a.name || a.email).localeCompare(b.name || b.email)
    })

    return sorted.slice(0, limit)
  },
})
