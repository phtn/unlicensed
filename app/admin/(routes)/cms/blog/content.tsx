'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useMutation, useQuery} from 'convex/react'
import {Suspense, useState} from 'react'
import {Blogposts} from './blogposts'
import {EditBlogpost} from './edit-blogpost'
import {NewBlogpost} from './new-blogpost'

const BlogContentInner = () => {
  const blogs = useQuery(api.blogs.q.list)
  const deleteBlog = useMutation(api.blogs.m.remove)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [tabId, , id] = useAdminTabId()

  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setIsDeleting(blogId)
    try {
      await deleteBlog({id: blogId as Id<'blogs'>})
    } catch (error) {
      console.error('Failed to delete blog', error)
      alert('Failed to delete blog')
    } finally {
      setIsDeleting(null)
    }
  }

  switch (tabId) {
    case 'new':
      return <NewBlogpost />
    case 'edit':
      if (!id) {
        return (
          <MainWrapper className='border-t-0'>
            <Suspense fallback={<div>Loading...</div>}>
              <Blogposts
                deleteFn={handleDelete}
                blogs={blogs ?? []}
                isDeleting={isDeleting}
              />
            </Suspense>
          </MainWrapper>
        )
      }
      return <EditBlogpost id={id} />
    default:
      return (
        <MainWrapper className='border-t-0'>
          <Suspense fallback={<div>Loading...</div>}>
            <Blogposts
              deleteFn={handleDelete}
              blogs={blogs ?? []}
              isDeleting={isDeleting}
            />
          </Suspense>
        </MainWrapper>
      )
  }
}

export const BlogContent = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogContentInner />
    </Suspense>
  )
}

