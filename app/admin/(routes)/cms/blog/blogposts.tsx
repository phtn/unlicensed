'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {
  Button,
  Card,
  Chip,
  ChipProps,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react'
import Link from 'next/link'
import React, {ReactNode, useMemo} from 'react'

interface BlogpostsProps {
  blogs: Array<Doc<'blogs'>>
  deleteFn: (id: string) => Promise<void>
  isDeleting: string | null
}

const columns = [
  {name: 'TITLE', uid: 'title'},
  {name: 'SLUG', uid: 'slug'},
  {name: 'STATUS', uid: 'status'},
  {name: 'PUBLISHED', uid: 'published'},
  {name: 'ACTIONS', uid: 'actions'},
]

const getStatusChipColor = (
  status: Doc<'blogs'>['status'],
): ChipProps['color'] => {
  switch (status) {
    case 'published':
      return 'success'
    case 'archived':
      return 'warning'
    case 'draft':
    default:
      return 'default'
  }
}

export const Blogposts = ({blogs, deleteFn, isDeleting}: BlogpostsProps) => {
  const handleDelete = (id: string) => async () => {
    await deleteFn(id)
  }

  const renderCell = (blog: Doc<'blogs'>, columnKey: React.Key) => {
    switch (columnKey) {
      case 'title':
        return (
          <p className='text-bold text-small text-foreground'>{blog.title}</p>
        )
      case 'slug':
        return (
          <p className='text-bold text-small text-default-500'>{blog.slug}</p>
        )
      case 'status':
        return (
          <Chip
            className='capitalize border-none gap-1 text-default-600'
            color={getStatusChipColor(blog.status)}
            size='sm'
            variant='dot'>
            {blog.status}
          </Chip>
        )
      case 'published':
        return (
          <p className='text-bold text-small text-default-500'>
            {blog.publishedAt ? formatDate(blog.publishedAt) : '—'}
          </p>
        )
      case 'actions':
        return (
          <div className='flex items-center gap-2'>
            <Link href={`/admin/cms/blog?tabId=edit&id=${blog._id}`}>
              <Button variant='ghost' size='sm'>
                <Icon name='pencil-single-solid' className='w-4 h-4' />
              </Button>
            </Link>
            <Button
              variant='ghost'
              size='sm'
              className='text-red-500 hover:text-red-600 hover:bg-red-100/10'
              disabled={isDeleting === blog._id}
              onPress={handleDelete(blog._id)}>
              <Icon name='x' className='w-4 h-4' />
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  const classNames = useMemo(
    () => ({
      td: [
        'first:group-data-[first=true]/tr:before:rounded-none',
        'last:group-data-[first=true]/tr:before:rounded-none',
        'group-data-[middle=true]/tr:before:rounded-none',
        'first:group-data-[last=true]/tr:before:rounded-none',
        'last:group-data-[last=true]/tr:before:rounded-none',
      ],
      tbody: '',
    }),
    [],
  )

  if (blogs.length === 0) {
    return (
      <Card shadow='sm' className='p-4 dark:bg-dark-table/40'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No blog posts found.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      shadow='sm'
      radius='none'
      className={cn(
        'dark:bg-dark-table/40 bg-light-table/0 overflow-hidden rounded-t-2xl',
      )}>
      <div className='overflow-scroll'>
        <div className='flex items-end justify-between text-sm font-medium px-3 py-2'>
          <span>Blog Posts</span>
        </div>
        <Table
          removeWrapper
          radius='none'
          classNames={{
            ...classNames,
            tbody: 'overflow-hidden rounded-3xl',
            thead: '',
            th: 'sticky first:rounded-tl-[12.5px] last:rounded-tr-[12.5px] top-0 bg-white/60 dark:bg-dark-table/5 z-10 backdrop-blur-xl h-8 border-b border-gray-200 dark:border-dark-table',
          }}
          aria-label='Blog posts table'>
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align='start'
                className='tracking-wider text-xs font-medium'>
                <div className='drop-shadow-xs'>{column.name}</div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={'No blog posts found'} items={blogs}>
            {(blog) => (
              <TableRow
                key={blog._id}
                className='h-8 hover:bg-light-table/60 dark:hover:bg-origin/40 border-b-[0.33px] border-b-light-table last:border-b-0 dark:border-b-dark-table'>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(blog, columnKey) as ReactNode}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
