'use client'

import {BlogForm} from './blog-form'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'

interface EditBlogpostProps {
  id: string
}

export const EditBlogpost = ({id}: EditBlogpostProps) => {
  const blog = useQuery(
    api.blogs.q.getById,
    id ? {id: id as Id<'blogs'>} : 'skip',
  )

  if (blog === undefined) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Loading blog post...</p>
      </div>
    )
  }

  if (blog === null) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Blog post not found</p>
      </div>
    )
  }

  return (
    <BlogForm
      blogId={blog._id}
      initialValues={{
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        excerpt: blog.excerpt,
        coverImage: blog.coverImage ?? null,
        tags: blog.tags,
        flags: blog.flags ?? [],
        status: blog.status,
      }}
    />
  )
}

