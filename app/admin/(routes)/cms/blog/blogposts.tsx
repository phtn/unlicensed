'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatDate} from '@/utils/date'
import {
  Button,
  Card,
  Chip,
  Table,
} from '@heroui/react'
import Link from 'next/link'
import type {ChipProps} from '@heroui/react'

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
] as const

type ColumnKey = (typeof columns)[number]['uid']

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

  const renderCell = (blog: Doc<'blogs'>, columnKey: ColumnKey) => {
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
            variant='soft'>
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
              isDisabled={isDeleting === blog._id}
              onPress={handleDelete(blog._id)}>
              <Icon name='x' className='w-4 h-4' />
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  if (blogs.length === 0) {
    return (
      <Card className='md:rounded-lg md:p-4 dark:bg-dark-table/40'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No blog posts found.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'dark:bg-dark-table/40 bg-light-table/0 overflow-hidden rounded-t-2xl',
      )}>
      <div className='flex items-end justify-between px-3 py-2 text-sm font-medium'>
        <span>Blog Posts</span>
      </div>
      <Table variant='secondary'>
        <Table.ScrollContainer className='overflow-scroll'>
          <Table.Content aria-label='Blog posts table' className='min-w-[42rem]'>
            <Table.Header>
              {columns.map((column) => (
                <Table.Column
                  key={column.uid}
                  className='sticky top-0 h-8 border-b border-gray-200 bg-white/60 text-left text-xs font-medium tracking-wider first:rounded-tl-[12.5px] last:rounded-tr-[12.5px] backdrop-blur-xl dark:border-dark-table dark:bg-dark-table/5'>
                  <div className='drop-shadow-xs'>{column.name}</div>
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {blogs.map((blog) => (
                <Table.Row
                  key={blog._id}
                  id={blog._id}
                  className='h-8 border-b-[0.33px] border-b-light-table hover:bg-light-table/60 last:border-b-0 dark:border-b-dark-table dark:hover:bg-origin/40'>
                  {columns.map((column) => (
                    <Table.Cell
                      key={column.uid}
                      className='first:group-data-[first=true]/tr:before:rounded-none last:group-data-[first=true]/tr:before:rounded-none group-data-[middle=true]/tr:before:rounded-none first:group-data-[last=true]/tr:before:rounded-none last:group-data-[last=true]/tr:before:rounded-none'>
                      {renderCell(blog, column.uid)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </Card>
  )
}
