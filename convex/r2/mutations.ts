import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {internalMutation, mutation} from '../_generated/server'

export const recordR2Upload = mutation({
  args: {
    url: v.string(),
    author: v.string(),
    format: v.optional(v.string()),
    caption: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    uploadedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tags = [
      ...new Set((args.tags ?? []).map((tag) => tag.trim())),
    ].filter(Boolean)

    if (tags.length > 0) {
      const existing = await ctx.db
        .query('files')
        .withIndex('by_author', (q) => q.eq('author', args.author))
        .collect()
      const sourceTag = tags.find((tag) => tag.startsWith('source:'))
      const sizeTag = tags.find((tag) => tag.startsWith('size:'))

      const duplicate = existing.find((entry) => {
        if (!entry.tags?.length) return false
        if (sourceTag && sizeTag) {
          return entry.tags.includes(sourceTag) && entry.tags.includes(sizeTag)
        }
        return tags.every((tag) => entry.tags?.includes(tag))
      })

      if (duplicate) {
        return {duplicate: true, recordId: duplicate._id}
      }
    }

    const recordId = await ctx.db.insert('files', {
      body: args.url,
      author: args.author,
      format: args.format ?? 'image',
      caption: args.caption,
      tags: tags.length > 0 ? tags : undefined,
      uploadedAt: args.uploadedAt ?? Date.now(),
    })

    return {duplicate: false, recordId}
  },
})

export const scheduleR2Delete = internalMutation({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.r2.actions.deleteR2Object, {
      url: args.url,
    })
  },
})
