import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {query} from '../_generated/server'

export const get = query({
  args: {
    storageId: v.union(v.id('_storage'), v.string()),
    author: v.id('users'),
  },
  handler: async (ctx, {author: _author, storageId}) => {
    if (typeof storageId === 'string' && storageId.startsWith('http')) {
      return storageId
    }
    return await ctx.storage.getUrl(storageId as Id<'_storage'>)
  },
})
