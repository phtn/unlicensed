import {query} from '../_generated/server'

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()
    return categories.sort((a, b) => a.name.localeCompare(b.name))
  },
})
