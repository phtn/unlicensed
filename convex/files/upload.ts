import {Infer, v} from 'convex/values'
import {mutation, query} from '../_generated/server'

export const fileSchema = v.object({
  body: v.id('_storage'),
  author: v.string(),
  format: v.string(),
  caption: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  uploadedAt: v.optional(v.number()),
})

export type UploadType = Infer<typeof fileSchema>

export const url = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const file = mutation({
  args: {
    storageId: v.id('_storage'),
    author: v.string(),
    format: v.optional(v.string()),
    caption: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    uploadedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tags = [...new Set((args.tags ?? []).map((tag) => tag.trim()))].filter(
      Boolean,
    )

    if (tags.length > 0) {
      const existing = await ctx.db
        .query('files')
        .withIndex('by_author', (q) => q.eq('author', args.author))
        .collect()
      const sourceTag = tags.find((tag) => tag.startsWith('source:'))
      const sizeTag = tags.find((tag) => tag.startsWith('size:'))

      const duplicate = existing.find((entry) => {
        if (!entry.tags?.length) {
          return false
        }

        if (sourceTag && sizeTag) {
          return (
            entry.tags.includes(sourceTag) &&
            entry.tags.includes(sizeTag)
          )
        }

        return tags.every((tag) => entry.tags?.includes(tag))
      })

      if (duplicate) {
        await ctx.storage.delete(args.storageId)
        return {
          duplicate: true,
          recordId: duplicate._id,
        }
      }
    }

    const recordId = await ctx.db.insert('files', {
      body: args.storageId,
      author: args.author,
      format: args.format ?? 'image',
      caption: args.caption,
      tags: tags.length > 0 ? tags : undefined,
      uploadedAt: args.uploadedAt ?? Date.now(),
    })

    return {
      duplicate: false,
      recordId,
    }
  },
})

export const existingPreviewSizes = query({
  args: {
    author: v.string(),
    sourceHash: v.string(),
  },
  handler: async (ctx, {author, sourceHash}) => {
    const files = await ctx.db
      .query('files')
      .withIndex('by_author', (q) => q.eq('author', author))
      .collect()

    const sourceTag = `source:${sourceHash}`
    const sizes = new Set<number>()

    for (const file of files) {
      const tags = file.tags ?? []
      if (!tags.includes(sourceTag)) {
        continue
      }

      for (const tag of tags) {
        if (!tag.startsWith('size:')) {
          continue
        }

        const parsedSize = Number.parseInt(tag.slice(5), 10)
        if (Number.isFinite(parsedSize)) {
          sizes.add(parsedSize)
        }
      }
    }

    return [...sizes].sort((a, b) => b - a)
  },
})
