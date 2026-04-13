import {query} from '../_generated/server'

export const listNonWebp = query({
  args: {},
  handler: async (ctx) => {
    const allFiles = await ctx.db.system.query('_storage').collect()
    const nonWebp = allFiles.filter((file) => file.contentType !== 'image/webp')
    return Promise.all(
      nonWebp.map(async (file) => ({
        storageId: file._id,
        contentType: file.contentType,
        url: await ctx.storage.getUrl(file._id),
      })),
    )
  },
})
