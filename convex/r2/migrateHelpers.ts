import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {internalMutation, internalQuery} from '../_generated/server'

export const getProductsToMigrate = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query('products').order('asc')
    const allProducts = await query.collect()

    // Simple cursor-based pagination using product ID
    const startIdx = args.cursor
      ? allProducts.findIndex((p) => String(p._id) === args.cursor) + 1
      : 0

    const batch = allProducts.slice(startIdx, startIdx + args.batchSize)
    const nextCursor =
      startIdx + args.batchSize < allProducts.length
        ? String(batch[batch.length - 1]?._id)
        : undefined

    const items = await Promise.all(
      batch
        .filter((product) => {
          const hasStorageImage =
            product.image && !String(product.image).startsWith('http')
          const hasStorageGallery = (product.gallery ?? []).some(
            (item) => !String(item).startsWith('http'),
          )
          return hasStorageImage || hasStorageGallery
        })
        .map(async (product) => {
          let imageUrl: string | null = null
          const imageStorageId = product.image
            ? String(product.image)
            : undefined

          if (imageStorageId && !imageStorageId.startsWith('http')) {
            imageUrl = await ctx.storage.getUrl(
              imageStorageId as Id<'_storage'>,
            )
          }

          const galleryToMigrate = await Promise.all(
            (product.gallery ?? [])
              .filter((item) => !String(item).startsWith('http'))
              .map(async (item) => {
                const storageId = String(item)
                const url = await ctx.storage.getUrl(
                  storageId as Id<'_storage'>,
                )
                return {storageId, url}
              }),
          )

          return {
            id: String(product._id),
            slug: product.slug,
            imageStorageId: imageStorageId ?? undefined,
            imageUrl,
            currentGallery: (product.gallery ?? []).map(String),
            galleryToMigrate: galleryToMigrate.filter(
              (item): item is {storageId: string; url: string} =>
                item.url !== null,
            ),
          }
        }),
    )

    return {items, nextCursor}
  },
})

export const updateProductImages = internalMutation({
  args: {
    productId: v.string(),
    image: v.optional(v.string()),
    gallery: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {}
    if (args.image !== undefined) updates.image = args.image
    if (args.gallery !== undefined) updates.gallery = args.gallery

    await ctx.db.patch(args.productId as Id<'products'>, updates)
  },
})

export const getCategoriesToMigrate = internalQuery({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()

    const results = await Promise.all(
      categories
        .filter(
          (cat) =>
            cat.heroImage && !String(cat.heroImage).startsWith('http'),
        )
        .map(async (cat) => {
          const heroImageStorageId = String(cat.heroImage)
          const heroImageUrl = await ctx.storage.getUrl(
            heroImageStorageId as Id<'_storage'>,
          )
          return {
            id: String(cat._id),
            slug: cat.slug,
            heroImageStorageId,
            heroImageUrl,
          }
        }),
    )

    return results.filter(
      (r): r is typeof r & {heroImageUrl: string} => r.heroImageUrl !== null,
    )
  },
})

export const updateCategoryHeroImage = internalMutation({
  args: {
    categoryId: v.string(),
    heroImage: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.categoryId as Id<'categories'>, {
      heroImage: args.heroImage,
    })
  },
})

export const getFilesToMigrate = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.number(),
  },
  handler: async (ctx, args) => {
    const allFiles = await ctx.db.query('files').order('asc').collect()

    const startIdx = args.cursor
      ? allFiles.findIndex((f) => String(f._id) === args.cursor) + 1
      : 0

    const batch = allFiles.slice(startIdx, startIdx + args.batchSize)
    const nextCursor =
      startIdx + args.batchSize < allFiles.length
        ? String(batch[batch.length - 1]?._id)
        : undefined

    const items = await Promise.all(
      batch
        .filter((file) => !String(file.body).startsWith('http'))
        .map(async (file) => {
          const storageId = String(file.body)
          const url = await ctx.storage.getUrl(storageId as Id<'_storage'>)
          return {
            id: String(file._id),
            storageId,
            author: file.author,
            url,
          }
        }),
    )

    return {
      items: items.filter(
        (item): item is typeof item & {url: string} => item.url !== null,
      ),
      nextCursor,
    }
  },
})

export const updateFileBody = internalMutation({
  args: {
    fileId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.fileId as Id<'files'>, {body: args.body})
  },
})
