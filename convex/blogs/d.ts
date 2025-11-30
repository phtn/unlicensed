import {Infer, v} from 'convex/values'

export const blogSchema = v.object({
  title: v.string(),
  slug: v.string(),
  content: v.string(), // HTML content
  excerpt: v.string(),
  coverImage: v.optional(v.string()),
  tags: v.array(v.string()),
  // Vercel flags - storing keys of flags that need to be active
  flags: v.optional(v.array(v.string())),
  status: v.union(v.literal('draft'), v.literal('published'), v.literal('archived')),
  publishedAt: v.optional(v.number()),
  authorId: v.optional(v.id('users')),
  updatedAt: v.optional(v.number()),
  createdAt: v.number(),
})

export type BlogType = Infer<typeof blogSchema>

