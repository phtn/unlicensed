'use node'

import {PutObjectCommand} from '@aws-sdk/client-s3'
import {v} from 'convex/values'
import {internal} from '../_generated/api'
import {internalAction} from '../_generated/server'
import {getR2Client, getR2Config} from './client'

type ProductBatch = {
  items: Array<{
    id: string
    slug: string | undefined
    imageStorageId: string | undefined
    imageUrl: string | null
    currentGallery: string[]
    galleryToMigrate: Array<{storageId: string; url: string}>
  }>
  nextCursor: string | undefined
}

type FileBatch = {
  items: Array<{
    id: string
    storageId: string
    author: string
    url: string
  }>
  nextCursor: string | undefined
}

export const migrateProductImages = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{migrated: number; done: boolean}> => {
    const batchSize = args.batchSize ?? 10

    const batch: ProductBatch = await ctx.runQuery(
      internal.r2.migrateHelpers.getProductsToMigrate,
      {cursor: args.cursor, batchSize},
    )

    if (batch.items.length === 0) {
      console.log('Product image migration complete.')
      return {migrated: 0, done: true}
    }

    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()
    const base = publicUrl.replace(/\/$/, '')
    let migrated = 0

    for (const product of batch.items) {
      const updates: {image?: string; gallery?: string[]} = {}

      if (product.imageUrl && product.imageStorageId) {
        const key = `products/${product.slug || product.id}/${product.imageStorageId}.webp`
        const uploaded = await uploadToR2(client, bucketName, key, product.imageUrl)
        if (uploaded) {
          updates.image = `${base}/${key}`
          migrated++
        }
      }

      if (product.galleryToMigrate.length > 0) {
        const newGallery = [...(product.currentGallery ?? [])]
        for (const item of product.galleryToMigrate) {
          if (!item.url) continue
          const key = `products/${product.slug || product.id}/gallery/${item.storageId}.webp`
          const uploaded = await uploadToR2(client, bucketName, key, item.url)
          if (uploaded) {
            const idx = newGallery.indexOf(item.storageId)
            if (idx !== -1) {
              newGallery[idx] = `${base}/${key}`
            }
            migrated++
          }
        }
        updates.gallery = newGallery
      }

      if (Object.keys(updates).length > 0) {
        await ctx.runMutation(
          internal.r2.migrateHelpers.updateProductImages,
          {productId: product.id, ...updates},
        )
      }
    }

    if (batch.nextCursor) {
      await ctx.scheduler.runAfter(1000, internal.r2.migrate.migrateProductImages, {
        cursor: batch.nextCursor,
        batchSize,
      })
    }

    console.log(`Migrated ${migrated} images in this batch. ${batch.nextCursor ? 'Continuing...' : 'Done.'}`)
    return {migrated, done: !batch.nextCursor}
  },
})

export const migrateCategoryHeroImages = internalAction({
  args: {},
  handler: async (ctx): Promise<{migrated: number}> => {
    const categories: Array<{
      id: string
      slug: string | undefined
      heroImageStorageId: string
      heroImageUrl: string
    }> = await ctx.runQuery(
      internal.r2.migrateHelpers.getCategoriesToMigrate,
      {},
    )

    if (categories.length === 0) {
      console.log('No category hero images to migrate.')
      return {migrated: 0}
    }

    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()
    const base = publicUrl.replace(/\/$/, '')
    let migrated = 0

    for (const cat of categories) {
      if (!cat.heroImageUrl) continue
      const key = `categories/${cat.slug || cat.id}/${cat.heroImageStorageId}.webp`
      const uploaded = await uploadToR2(client, bucketName, key, cat.heroImageUrl)
      if (uploaded) {
        await ctx.runMutation(
          internal.r2.migrateHelpers.updateCategoryHeroImage,
          {categoryId: cat.id, heroImage: `${base}/${key}`},
        )
        migrated++
      }
    }

    console.log(`Migrated ${migrated} category hero images.`)
    return {migrated}
  },
})

export const migrateFileRecords = internalAction({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{migrated: number; done: boolean}> => {
    const batchSize = args.batchSize ?? 10

    const batch: FileBatch = await ctx.runQuery(
      internal.r2.migrateHelpers.getFilesToMigrate,
      {cursor: args.cursor, batchSize},
    )

    if (batch.items.length === 0) {
      console.log('File records migration complete.')
      return {migrated: 0, done: true}
    }

    const client = getR2Client()
    const {bucketName, publicUrl} = getR2Config()
    const base = publicUrl.replace(/\/$/, '')
    let migrated = 0

    for (const file of batch.items) {
      if (!file.url) continue
      const key = `files/${file.author}/${file.storageId}.webp`
      const uploaded = await uploadToR2(client, bucketName, key, file.url)
      if (uploaded) {
        await ctx.runMutation(
          internal.r2.migrateHelpers.updateFileBody,
          {fileId: file.id, body: `${base}/${key}`},
        )
        migrated++
      }
    }

    if (batch.nextCursor) {
      await ctx.scheduler.runAfter(1000, internal.r2.migrate.migrateFileRecords, {
        cursor: batch.nextCursor,
        batchSize,
      })
    }

    console.log(`Migrated ${migrated} file records in this batch.`)
    return {migrated, done: !batch.nextCursor}
  },
})

async function uploadToR2(
  client: ReturnType<typeof getR2Client>,
  bucketName: string,
  key: string,
  sourceUrl: string,
): Promise<boolean> {
  try {
    const response = await fetch(sourceUrl)
    if (!response.ok) {
      console.warn(`Failed to fetch ${sourceUrl}: ${response.status}`)
      return false
    }
    const body = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/webp'

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(body),
        ContentType: contentType,
      }),
    )
    return true
  } catch (error) {
    console.error(`Failed to upload ${key} to R2:`, error)
    return false
  }
}
