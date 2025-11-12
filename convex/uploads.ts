import {mutation, query} from './_generated/server'
import {v} from 'convex/values'
import type {Id} from './_generated/dataModel'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const getStorageUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const storageId = args.storageId as Id<'_storage'>
    const url = await ctx.storage.getUrl(storageId)
    return url
  },
})

