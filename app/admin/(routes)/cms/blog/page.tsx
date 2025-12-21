'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {Blogposts} from '@/app/admin/(routes)/cms/blog/blogposts'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useMutation, useQuery} from 'convex/react'
import {useState} from 'react'

export default function BlogListPage() {
  const blogs = useQuery(api.blogs.q.list)
  const deleteBlog = useMutation(api.blogs.m.remove)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    // Cast id to Id<'blogs'> if needed, but string usually works if passed correctly,
    // better to be safe with types if I had them handy.
    // api.blogs.m.remove expects Id<'blogs'>
    setIsDeleting(id)
    try {
      await deleteBlog({id: id as Id<'blogs'>})
    } catch (error) {
      console.error('Failed to delete blog', error)
      alert('Failed to delete blog')
    } finally {
      setIsDeleting(null)
    }
  }

  if (blogs === undefined) {
    return <div className='p-8'>Loading...</div>
  }

  return (
    <MainWrapper>
      {/*<div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Blog Posts</h1>
        <Link href='/admin/blog/create'>
          <Button>
            <Plus className='w-4 h-4 mr-2' />
            Create Post
          </Button>
        </Link>
      </div>*/}

      <Blogposts
        deleteFn={handleDelete}
        blogs={blogs}
        isDeleting={isDeleting}
      />
    </MainWrapper>
  )
}
