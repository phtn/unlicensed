'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {
  Button,
  Card,
  Chip,
  ChipProps,
  Image,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import React, {CSSProperties, ReactNode, useEffect} from 'react'

type Activity = Doc<'activities'>

const columns = [
  {name: 'USER', uid: 'user'},
  {name: 'ACTIVITY', uid: 'activity'},
  {name: 'TYPE', uid: 'type'},
  {name: 'DETAILS', uid: 'details'},
  {name: 'SEEN BY', uid: 'seenBy'},
  {name: 'TIME', uid: 'time'},
]

const getActivityIcon = (type: Activity['type']): IconName => {
  switch (type) {
    case 'user_signup':
      return 'user'
    case 'order_created':
      return 'arrow-right-down-circle-fill'
    case 'order_confirmed':
      return 'check'
    case 'order_processing':
      return 'refresh-2-fill'
    case 'order_shipped':
      return 'airplane-takeoff'
    case 'order_delivered':
      return 'box-bold'
    case 'order_cancelled':
      return 'cancel-circle'
    case 'order_refunded':
      return 'x'
    case 'payment_completed':
      return 'receive-money-fill'
    case 'payment_failed':
      return 'x'
    case 'product_created':
      return 't'
    case 'product_updated':
      return 't'
    case 'category_created':
    case 'category_updated':
      return 'eye'
    default:
      return 'eye'
  }
}

const getActivityIconColor = (type: Activity['type']) => {
  if (type.startsWith('order_')) {
    if (type.includes('delivered')) return 'text-dark-gray dark:text-limited '
    if (type.includes('cancelled') || type.includes('refunded'))
      return 'text-red-500'
    return 'text-mac-blue'
  }
  if (type.startsWith('payment_')) {
    if (type.includes('completed')) return 'text-deal'
    if (type.includes('failed')) return 'text-red-500'
    return 'text-yellow-500'
  }
  if (type.startsWith('user_')) return 'text-brand'
  if (type.startsWith('product_')) return 'text-cyan-500'
  if (type.startsWith('category_')) return 'text-orange-500'
  return 'text-gray-500'
}

const getActivityChipColor = (type: Activity['type']): ChipProps['color'] => {
  if (type.startsWith('order_')) {
    if (type.includes('delivered')) return 'success'
    if (type.includes('cancelled') || type.includes('refunded')) return 'danger'
    return 'primary'
  }
  if (type.startsWith('payment_')) {
    if (type.includes('completed')) return 'success'
    if (type.includes('failed')) return 'danger'
    return 'warning'
  }
  if (type.startsWith('user_')) return 'secondary'
  if (type.startsWith('product_')) return 'default'
  if (type.startsWith('category_')) return 'default'
  return 'default'
}

const getActivityTypeLabel = (type: Activity['type']) => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

interface RecentActivitiesProps {
  fullTable: boolean
  toggleFullTable: VoidFunction
  isMobile: boolean
  visibleStatsCount: number
  breakpoint: 'mobile' | 'md' | 'lg'
  statsHeight: number
}

export const RecentActivities = ({
  fullTable,
  toggleFullTable,
  isMobile,
  statsHeight,
}: RecentActivitiesProps) => {
  const {user: firebaseUser} = useAuth()
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {fid: firebaseUser.uid} : 'skip',
  )
  const markAsViewed = useMutation(api.activityViews.m.markActivityAsViewed)

  const activities = useQuery(api.activities.q.getRecentActivities, {
    limit: 30,
  })

  // Mark activities as viewed when component mounts or activities change
  useEffect(() => {
    if (activities && convexUser) {
      activities.forEach((activity) => {
        markAsViewed({
          activityId: activity._id,
          userId: convexUser._id,
        }).catch(() => {
          // Silently fail if already viewed
        })
      })
    }
  }, [activities, convexUser, markAsViewed])

  const renderCell = React.useCallback(
    (
      activity: Activity & {
        user?: {name: string; email: string; photoUrl?: string} | null
        viewers?: Array<{
          userId: string
          name: string
          email: string
          photoUrl?: string
        }>
      },
      columnKey: React.Key,
    ) => {
      const cellValue = activity[columnKey as keyof Activity]

      switch (columnKey) {
        case 'user':
          if (activity.user) {
            return (
              <User
                avatarProps={{
                  size: 'sm',
                  radius: 'full',
                  src: activity.user.photoUrl,
                }}
                classNames={{
                  description: 'text-default-500',
                }}
                name={
                  isMobile
                    ? activity.user.name.split(' ').shift()
                    : activity.user.name
                }>
                {activity.user.email}
              </User>
            )
          }
          return (
            <div className='flex items-center gap-2'>
              <div className='flex flex-col'>
                <p className='font-brk text-xs uppercase text-default-400'>
                  System
                </p>
              </div>
            </div>
          )
        case 'activity':
          return (
            <div className='flex items-center gap-3'>
              <div
                className={`shrink-0 ${getActivityIconColor(activity.type)}`}>
                <Icon
                  name={getActivityIcon(activity.type)}
                  className='w-5 h-5'
                />
              </div>
              <div className='flex flex-col'>
                <p className='text-bold text-small text-foreground whitespace-nowrap'>
                  {activity.title}
                </p>
              </div>
            </div>
          )
        case 'type':
          return (
            <Chip
              className='border-none gap-1 opacity-70 font-brk uppercase'
              color={getActivityChipColor(activity.type)}
              size='sm'
              variant='dot'>
              {getActivityTypeLabel(activity.type)}
            </Chip>
          )
        case 'details':
          return (
            <div className='flex flex-col whitespace-nowrap'>
              {activity.metadata?.orderNumber && (
                <Link
                  href={`/admin/ops/orders/${activity.metadata.orderNumber}`}>
                  <div className='text-bold text-small capitalize flex items-center opacity-70 hover:underline underline-offset-4 decoration-dotted decoration-blue-500 dark:decoration-primary hover:opacity-100'>
                    <Icon name='hash' className='' />
                    <span>{activity.metadata.orderNumber?.substring(5)}</span>
                  </div>
                </Link>
              )}
              {activity.metadata?.productName && (
                <p className='text-bold text-small capitalize'>
                  {activity.metadata.productName}
                </p>
              )}
              {activity.metadata?.categoryName && (
                <p className='text-bold text-small capitalize'>
                  {activity.metadata.categoryName}
                </p>
              )}
              {!activity.metadata?.orderNumber &&
                !activity.metadata?.productName &&
                !activity.metadata?.categoryName && (
                  <p className='text-bold text-tiny text-default-500'>—</p>
                )}
            </div>
          )
        case 'seenBy':
          const viewers = activity.viewers || []
          if (viewers.length === 0) {
            return (
              <p className='text-bold text-tiny text-default-400'>Not viewed</p>
            )
          }
          return (
            <div className='flex items-center gap-1'>
              {viewers.slice(0, 5).map((viewer, i) => (
                <div
                  key={viewer.userId}
                  className={cn('shrink-0', {'-translate-x-3': i !== 0})}
                  title={`${viewer.name} (${viewer.email})`}>
                  <div className='flex size-6 items-center justify-center overflow-hidden rounded-full shadow-md'>
                    {viewer.photoUrl ? (
                      <Image
                        src={viewer.photoUrl}
                        alt={viewer.name}
                        className='h-full w-full object-cover border-[1.5px] border-white'
                      />
                    ) : (
                      <span className='text-xs font-medium text-default-600'>
                        {viewer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {viewers.length > 5 && (
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-default-100 ring-2 ring-background'>
                  <span className='text-xs font-medium text-default-600'>
                    +{viewers.length - 5}
                  </span>
                </div>
              )}
            </div>
          )
        case 'time':
          return (
            <p className='text-bold text-small text-default-500'>
              {formatTimestamp(activity.createdAt)}
            </p>
          )
        default:
          return cellValue
      }
    },
    [isMobile],
  )

  // Calculate translate values based on measured stats height
  const translateStyle = React.useMemo(() => {
    if (statsHeight === 0 || !fullTable) {
      return {}
    }

    // Use the actual measured height of the stats container
    // Add the spacing between stats and activities (space-y-4 = 1rem = 16px)
    // Convert pixels to rem (assuming 16px = 1rem)
    const spacingRem = 1 // space-y-4 = 1rem
    const translateYRem = statsHeight / 12 + spacingRem

    // Apply the transform using CSS custom property
    return {
      '--translate-y': `-${translateYRem}rem`,
    } as CSSProperties
  }, [statsHeight, fullTable])

  const classNames = React.useMemo(
    () => ({
      // wrapper: ['h-[calc(100vh-240px)] overflow-scroll', 'max-w-full'],
      // th: ['bg-transparent', 'text-default-500', 'border-b', 'border-divider'],
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

  if (activities === undefined) {
    return (
      <Card shadow='sm' className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading activities...</p>
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card shadow='sm' className='p-4 dark:bg-dark-table/60'>
        <h2 className='text-lg font-polysans mb-4 px-4'>Recent Activity</h2>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No activities yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      shadow='none'
      radius='none'
      style={fullTable ? translateStyle : undefined}
      className={cn(
        'relative z-300 border border-black dark:bg-dark-table/40 bg-light-table/0 overflow-hidden md:rounded-t-2xl md:w-full w-screen overflow-x-scroll mask-[linear-gradient(white,white)]',
        'transition-transform duration-300 border-t border-light-gray/40',
        {
          'h-full bg-sidebar/40': fullTable,
          'transform-[translateY(var(--translate-y))]': fullTable,
        },
      )}>
      <div
        className={cn(
          'h-lvh md:h-[calc(100lvh-203px)] overflow-scroll transition-transform duration-300',
          {
            'md:h-[calc(100lvh-66px)]': fullTable,
          },
        )}>
        <div className='relative font-polysans text-sm flex items-center justify-between px-3 py-2 md:w-full w-screen'>
          <div className='flex w-full'>Today</div>
          <Button
            size='sm'
            isIconOnly
            id='toggle-full-table'
            onPress={toggleFullTable}
            className='dark:bg-origin/60 bg-sidebar/60 scale-80 rounded-md px-0 overflow-hidden aspect-square flex-1 opacity-60 hover:opacity-100'>
            <Icon
              name='chevron-double-left'
              className={cn('size-7 rotate-45', fullTable && '-rotate-45')}
            />
          </Button>
        </div>
        <Table
          removeWrapper
          radius='none'
          classNames={{
            ...classNames,
            tbody: 'overflow-hidden rounded-3xl',
            th: [
              'sticky top-0 overflow-hidden bg-sidebar dark:bg-dark-table backdrop-blur-3xl z-20 h-9 border-b border-sidebar dark:border-dark-table',
            ],
          }}
          aria-label='Recent activities table'>
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
          <TableBody emptyContent={'No activities found'} items={activities}>
            {(activity) => (
              <TableRow
                key={activity._id}
                className='h-8 hover:bg-light-table/60 dark:hover:bg-origin/40 border-b-[0.33px] border-b-light-table last:border-b-0 dark:border-b-dark-table'>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(activity, columnKey) as ReactNode}
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
