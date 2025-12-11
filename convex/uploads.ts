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

export const getStorageUrls = query({
  args: {
    storageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (storageId) => {
        try {
          const url = await ctx.storage.getUrl(storageId as Id<'_storage'>)
          return {storageId, url}
        } catch {
          return {storageId, url: null}
        }
      }),
    )
    return urls
  },
})

