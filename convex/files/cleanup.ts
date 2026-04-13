import {v} from 'convex/values'
import type {Id} from '../_generated/dataModel'
import {internal} from '../_generated/api'
import {internalMutation, mutation} from '../_generated/server'

const BATCH_SIZE = 50

/**
 * Internal mutation: processes one batch of files and deletes any whose storage
 * content-type is not `image/webp`. Orphaned records (storage file already gone)
 * are also removed. Schedules itself to continue if more files remain.
 */
export const deleteNonWebpBatch = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query('files')
      .paginate({numItems: BATCH_SIZE, cursor: args.cursor})

    let deleted = 0
    let kept = 0

    for (const file of result.page) {
      // Skip R2-backed files (already WebP from client-side optimization)
      if (String(file.body).startsWith('http')) {
        kept++
        continue
      }

      const metadata = await ctx.db.system.get('_storage', file.body as Id<'_storage'>)
      const isWebp = metadata?.contentType === 'image/webp'

      if (!isWebp) {
        // Delete the storage object if it still exists
        if (metadata) {
          await ctx.storage.delete(file.body as Id<'_storage'>)
        }
        // Always remove the files table record
        await ctx.db.delete(file._id)
        deleted++
      } else {
        kept++
      }
    }

    // Schedule the next batch if there are more files to process
    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.files.cleanup.deleteNonWebpBatch, {
        cursor: result.continueCursor,
      })
    }

    return {deleted, kept, isDone: result.isDone}
  },
})

/**
 * Public mutation: kicks off the cleanup. Call this once from the Convex dashboard
 * or your admin tooling — it will process the entire `files` table in batches of
 * 50, keeping only WebP files.
 */
export const startDeleteNonWebp = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.files.cleanup.deleteNonWebpBatch, {
      cursor: null,
    })
    return {started: true}
  },
})
