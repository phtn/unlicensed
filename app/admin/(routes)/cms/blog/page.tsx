'use client'

import {api} from '@/convex/_generated/api'
import {Button} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import {format} from 'date-fns'
import {Pencil, Plus, Trash2} from 'lucide-react'
import Link from 'next/link'
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
      await deleteBlog({id: id as any})
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
    <div className='p-8 max-w-7xl mx-auto space-y-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Blog Posts</h1>
        <Link href='/admin/blog/create'>
          <Button>
            <Plus className='w-4 h-4 mr-2' />
            Create Post
          </Button>
        </Link>
      </div>

      <div className='rounded-md border'>
        <div className='relative w-full overflow-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_tr]:border-b'>
              <tr className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
                  Title
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
                  Slug
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
                  Status
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
                  Published
                </th>
                <th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='[&_tr:last-child]:border-0'>
              {blogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className='p-4 text-center text-muted-foreground'>
                    No blog posts found.
                  </td>
                </tr>
              )}
              {blogs.map((blog) => (
                <tr
                  key={blog._id}
                  className='border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'>
                  <td className='p-4 align-middle font-medium'>{blog.title}</td>
                  <td className='p-4 align-middle'>{blog.slug}</td>
                  <td className='p-4 align-middle'>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        blog.status === 'published'
                          ? 'bg-green-500/10 text-green-500'
                          : blog.status === 'archived'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-gray-500/10 text-gray-500'
                      }`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className='p-4 align-middle'>
                    {blog.publishedAt
                      ? format(blog.publishedAt, 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className='p-4 align-middle'>
                    <div className='flex items-center gap-2'>
                      <Link href={`/admin/blog/${blog.slug}`}>
                        <Button variant='ghost' size='sm'>
                          <Pencil className='w-4 h-4' />
                        </Button>
                      </Link>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-500 hover:text-red-600 hover:bg-red-100/10'
                        disabled={isDeleting === blog._id}
                        onPress={() => handleDelete(blog._id)}>
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
