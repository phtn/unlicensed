import {Infer, v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
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
        if (!entry.tags?.length) {
          return false
        }

        if (sourceTag && sizeTag) {
          return entry.tags.includes(sourceTag) && entry.tags.includes(sizeTag)
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

export const deleteManagedImage = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const fileRecords = await ctx.db
      .query('files')
      .withIndex('by_body', (q) => q.eq('body', args.storageId))
      .collect()

    const products = await ctx.db.query('products').collect()
    let affectedProducts = 0
    let removedFromPrimaryCount = 0
    let removedFromGalleryCount = 0

    for (const product of products) {
      const updates: Partial<Doc<'products'>> = {}
      let shouldPatch = false

      if (product.image === args.storageId) {
        updates.image = undefined
        removedFromPrimaryCount += 1
        shouldPatch = true
      }

      const currentGallery = product.gallery ?? []
      const nextGallery = currentGallery.filter(
        (item) => item !== args.storageId,
      )

      if (nextGallery.length !== currentGallery.length) {
        updates.gallery = nextGallery.length > 0 ? nextGallery : undefined
        removedFromGalleryCount += currentGallery.length - nextGallery.length
        shouldPatch = true
      }

      if (!shouldPatch) {
        continue
      }

      affectedProducts += 1
      await ctx.db.patch(product._id, updates)
    }

    const categories = await ctx.db.query('categories').collect()
    let removedFromCategoryHeroCount = 0

    for (const category of categories) {
      if (category.heroImage !== args.storageId) {
        continue
      }

      const updates: Partial<Doc<'categories'>> = {
        heroImage: undefined,
      }

      removedFromCategoryHeroCount += 1
      await ctx.db.patch(category._id, updates)
    }

    for (const fileRecord of fileRecords) {
      await ctx.db.delete(fileRecord._id)
    }

    await ctx.storage.delete(args.storageId)

    return {
      deletedFileRecords: fileRecords.length,
      affectedProducts,
      removedFromPrimaryCount,
      removedFromGalleryCount,
      removedFromCategoryHeroCount,
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

export const getTaggedStorageIds = query({
  args: {
    storageIds: v.array(v.id('_storage')),
    requiredTag: v.string(),
  },
  handler: async (ctx, args) => {
    const requiredTag = args.requiredTag.trim().toLowerCase()
    const uniqueStorageIds = [...new Set(args.storageIds)]
    const taggedStorageIds: Id<'_storage'>[] = []

    for (const storageId of uniqueStorageIds) {
      const files = ctx.db
        .query('files')
        .withIndex('by_body', (q) => q.eq('body', storageId))

      for await (const file of files) {
        const tags = (file.tags ?? [])
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)

        if (tags.includes(requiredTag)) {
          taggedStorageIds.push(storageId)
          break
        }
      }
    }

    return taggedStorageIds
  },
})

export const listImageGalleriesByTag = query({
  args: {
    requiredTag: v.optional(v.string()),
    maxTags: v.optional(v.number()),
    limitPerTag: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const requiredTag = args.requiredTag?.trim().toLowerCase() || null
    const maxTags = Math.min(Math.max(Math.floor(args.maxTags ?? 24), 1), 60)
    const limitPerTag = Math.min(
      Math.max(Math.floor(args.limitPerTag ?? 32), 1),
      120,
    )

    const allFiles = await ctx.db.query('files').collect()

    const byTag = new Map<string, typeof allFiles>()
    const totalsByTag = new Map<string, number>()
    const tagLabel = new Map<string, string>()

    const isTechnicalTag = (tag: string) =>
      tag.startsWith('source:') || tag.startsWith('size:')

    const sortedFiles = [...allFiles]
      .filter((file) => file.format === 'image')
      .sort(
        (a, b) =>
          (b.uploadedAt ?? b._creationTime) - (a.uploadedAt ?? a._creationTime),
      )

    for (const file of sortedFiles) {
      const tags = (file.tags ?? []).map((tag) => tag.trim()).filter(Boolean)
      if (tags.length === 0) {
        continue
      }

      const normalizedTags = tags.map((tag) => tag.toLowerCase())

      if (requiredTag && !normalizedTags.includes(requiredTag)) {
        continue
      }

      const curatedTagKeys = tags
        .map((tag) => ({key: tag.toLowerCase(), label: tag}))
        .filter(({key}) => {
          if (isTechnicalTag(key)) {
            return false
          }
          if (requiredTag && key === requiredTag) {
            return false
          }
          return true
        })

      const fallbackTag = requiredTag
        ? [{key: requiredTag, label: requiredTag}]
        : []
      const groupingTags =
        curatedTagKeys.length > 0 ? curatedTagKeys : fallbackTag

      for (const {key, label} of groupingTags) {
        if (!tagLabel.has(key)) {
          tagLabel.set(key, label)
        }

        totalsByTag.set(key, (totalsByTag.get(key) ?? 0) + 1)

        const group = byTag.get(key) ?? []
        if (group.length < limitPerTag) {
          byTag.set(key, [...group, file])
        }
      }
    }

    const sortedTagKeys = [...totalsByTag.keys()]
      .sort((a, b) => {
        const countDelta = (totalsByTag.get(b) ?? 0) - (totalsByTag.get(a) ?? 0)
        if (countDelta !== 0) {
          return countDelta
        }
        return a.localeCompare(b)
      })
      .slice(0, maxTags)

    const uniqueStorageIds = new Set<string>()
    for (const tagKey of sortedTagKeys) {
      const files = byTag.get(tagKey) ?? []
      for (const file of files) {
        uniqueStorageIds.add(String(file.body))
      }
    }

    const storageUrlMap = new Map<string, string | null>()
    await Promise.all(
      [...uniqueStorageIds].map(async (storageId) => {
        try {
          const url = await ctx.storage.getUrl(storageId as Id<'_storage'>)
          storageUrlMap.set(storageId, url ?? null)
        } catch {
          storageUrlMap.set(storageId, null)
        }
      }),
    )

    return {
      tags: sortedTagKeys.map((tagKey) => {
        const files = byTag.get(tagKey) ?? []
        return {
          tag: tagLabel.get(tagKey) ?? tagKey,
          total: totalsByTag.get(tagKey) ?? 0,
          items: files.map((file) => ({
            recordId: String(file._id),
            storageId: String(file.body),
            caption: file.caption ?? null,
            uploadedAt: file.uploadedAt ?? file._creationTime,
            url: storageUrlMap.get(String(file.body)) ?? null,
            tags: file.tags ?? [],
          })),
        }
      }),
    }
  },
})
