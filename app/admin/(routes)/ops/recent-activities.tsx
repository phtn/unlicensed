'use client'

import {api} from '@/convex/_generated/api'
import type {Doc} from '@/convex/_generated/dataModel'
import {useAuth} from '@/hooks/use-auth'
import {useConvexSnapshotQuery} from '@/hooks/use-convex-snapshot-query'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatTimestamp} from '@/utils/date'
import {getInitials} from '@/utils/initials'
import {Avatar, Button, Card, Chip, ChipProps, Table} from '@heroui/react'
import {useMutation} from 'convex/react'
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

type ActivityColumnKey = (typeof columns)[number]['uid']

const columnClassNameMap: Record<ActivityColumnKey, string> = {
  user: 'min-w-[18rem]',
  activity: 'min-w-[16rem]',
  type: 'min-w-[11rem]',
  details: 'min-w-[12rem]',
  seenBy: 'min-w-[10rem]',
  time: 'min-w-[9rem] whitespace-nowrap',
}

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
    case 'product_updated':
      return 'bag-solid'
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
    return 'danger'
  }
  if (type.startsWith('payment_')) {
    if (type.includes('completed')) return 'success'
    if (type.includes('failed')) return 'danger'
    return 'warning'
  }
  if (type.startsWith('user_')) return 'default'
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
  isMobile: _isMobile,
  visibleStatsCount: _visibleStatsCount,
  breakpoint: _breakpoint,
  statsHeight,
}: RecentActivitiesProps) => {
  const {convexUserId} = useAuth()
  const markAsViewed = useMutation(api.activityViews.m.markActivitiesAsViewed)
  const viewedActivityIdsRef = React.useRef<Set<string>>(new Set())

  const {data: activities, refresh: refreshActivities} = useConvexSnapshotQuery(
    api.activities.q.getRecentActivities,
    {
      limit: 30,
      includeUsers: true,
      includeViewers: true,
      viewerLimit: 5,
    },
  )

  // Mark activities as viewed when component mounts or activities change
  useEffect(() => {
    viewedActivityIdsRef.current = new Set()
  }, [convexUserId])

  useEffect(() => {
    if (!activities || !convexUserId) return

    const unseenActivityIds = activities
      .map((activity) => activity._id)
      .filter(
        (activityId) => !viewedActivityIdsRef.current.has(String(activityId)),
      )

    if (unseenActivityIds.length === 0) return

    unseenActivityIds.forEach((activityId) => {
      viewedActivityIdsRef.current.add(String(activityId))
    })

    markAsViewed({
      activityIds: unseenActivityIds,
      userId: convexUserId,
    })
      .then(() => {
        void refreshActivities()
      })
      .catch(() => {
        unseenActivityIds.forEach((activityId) => {
          viewedActivityIdsRef.current.delete(String(activityId))
        })
      })
  }, [activities, convexUserId, markAsViewed, refreshActivities])

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
        viewerCount?: number
      },
      columnKey: ActivityColumnKey,
    ): ReactNode => {
      const cellValue = activity[columnKey as keyof Activity]
      const activityUserName = activity.user?.name?.trim() || 'Unknown user'
      const activityUserEmail = activity.user?.email?.trim() || 'No email'

      switch (columnKey) {
        case 'user':
          if (activity.user) {
            return (
              <div className='flex min-w-0 items-center gap-3'>
                <Avatar className='size-9 shrink-0 border border-foreground/10 bg-background text-foreground shadow-sm dark:border-white/10 dark:bg-dark-table'>
                  <Avatar.Image
                    alt={activityUserName}
                    src={activity.user.photoUrl ?? undefined}
                  />
                  <Avatar.Fallback>
                    {getInitials(activityUserName)}
                  </Avatar.Fallback>
                </Avatar>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-foreground'>
                    {activityUserName}
                  </p>
                  <p className='truncate text-xs text-foreground/55'>
                    {activityUserEmail}
                  </p>
                </div>
              </div>
            )
          }
          return (
            <div className='flex min-w-0 items-center gap-3'>
              <div className='flex size-9 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/4 text-foreground/50 dark:border-white/10 dark:bg-white/4'>
                <Icon name='eye' className='size-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-medium text-foreground'>System</p>
                <p className='text-xs text-foreground/55'>
                  Automated platform activity
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
              variant='soft'>
              {getActivityTypeLabel(activity.type)}
            </Chip>
          )
        case 'details':
          return (
            <div className='flex min-w-0 flex-col'>
              {activity.metadata?.orderNumber && (
                <Link
                  href={`/admin/ops/orders/${activity.metadata.orderNumber}`}>
                  <div className='flex items-center gap-1 text-sm font-medium capitalize text-foreground/70 hover:text-foreground hover:underline underline-offset-4 decoration-dotted decoration-blue-500 dark:decoration-primary'>
                    <Icon name='hash' className='' />
                    <span>{activity.metadata.orderNumber?.substring(5)}</span>
                  </div>
                </Link>
              )}
              {activity.metadata?.productName && (
                <p className='truncate text-sm font-medium capitalize text-foreground'>
                  {activity.metadata.productName}
                </p>
              )}
              {activity.metadata?.categoryName && (
                <p className='truncate text-sm font-medium capitalize text-foreground'>
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
          const totalViewers = activity.viewerCount ?? viewers.length
          if (viewers.length === 0) {
            return (
              <p className='text-bold text-tiny text-default-400'>Not viewed</p>
            )
          }
          return (
            <div className='flex items-center'>
              {viewers.slice(0, 5).map((viewer, i) => (
                <div
                  key={viewer.userId}
                  className={cn('shrink-0', {'-ml-2.5': i !== 0})}
                  title={`${viewer.name} (${viewer.email})`}>
                  <Avatar className='size-7 border-2 border-background bg-default-100 text-default-600 shadow-sm dark:border-dark-table'>
                    <Avatar.Image
                      alt={viewer.name}
                      src={viewer.photoUrl ?? undefined}
                    />
                    <Avatar.Fallback>
                      {getInitials(viewer.name)}
                    </Avatar.Fallback>
                  </Avatar>
                </div>
              ))}
              {totalViewers > viewers.length && (
                <div className='ml-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-default-100 px-1.5 ring-2 ring-background dark:bg-white/10'>
                  <span className='text-xs font-medium text-default-600'>
                    +{totalViewers - viewers.length}
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
          return String(cellValue ?? '—')
      }
    },
    [],
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

  if (activities === undefined) {
    return (
      <Card className='p-4 dark:bg-dark-table/60'>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>Loading activities...</p>
        </div>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className='p-4 dark:bg-dark-table/60'>
        <h2 className='text-lg font-polysans mb-4 px-4'>Recent Activity</h2>
        <div className='flex items-center justify-center py-8'>
          <p className='text-sm text-gray-400'>No activities yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      style={fullTable ? translateStyle : undefined}
      className={cn(
        'relative z-300 w-full overflow-hidden rounded-t-2xl border border-zinc-300 bg-light-table/30 transition-transform duration-300 mask-[linear-gradient(white,white)] dark:border-dark-table dark:bg-dark-table/40',
        {
          'h-full bg-sidebar/40': fullTable,
          'transform-[translateY(var(--translate-y))]': fullTable,
        },
      )}>
      <div
        className={cn(
          'flex h-lvh min-h-0 flex-col transition-transform duration-300 md:h-[calc(100lvh-203px)]',
          {
            'md:h-[calc(100lvh-66px)]': fullTable,
          },
        )}>
        <div className='flex shrink-0 items-center justify-between border-b border-foreground/10 bg-background/85 px-3 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-dark-table/80'>
          <div className='flex items-center gap-2'>
            <span className='font-polysans text-sm text-foreground'>
              Recent activity
            </span>
            <span className='inline-flex min-w-6 items-center justify-center rounded-full bg-foreground/8 px-1.5 py-0.5 text-[10px] font-brk uppercase tracking-[0.18em] text-foreground/65'>
              {activities.length}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='hidden text-[10px] font-brk uppercase tracking-[0.18em] text-foreground/45 md:inline'>
              {fullTable ? 'Collapse' : 'Expand'}
            </span>
            <Button
              size='sm'
              isIconOnly
              variant='tertiary'
              id='toggle-full-table'
              onPress={toggleFullTable}
              className='h-7 w-7 rounded-lg bg-sidebar/60 px-0 text-foreground hover:bg-slate-400/20 dark:bg-sidebar/10'>
              <Icon
                name='chevron-left'
                className={cn('size-5 rotate-45', fullTable && '-rotate-45')}
              />
            </Button>
          </div>
        </div>
        <Table variant='secondary' className='min-h-0 flex-1 bg-transparent'>
          <Table.ScrollContainer className='min-h-0 flex-1 overflow-auto'>
            <Table.Content
              aria-label='Recent activities table'
              className='min-w-245'>
              <Table.Header>
                {columns.map((column) => (
                  <Table.Column
                    key={column.uid}
                    isRowHeader={column.uid === 'user'}
                    className={cn(
                      'sticky top-0 z-20 h-10 border-b border-sidebar bg-slate-200/90 text-xs font-medium tracking-[0.18em] text-slate-500 backdrop-blur-3xl dark:border-dark-table dark:bg-dark-table/95 dark:text-foreground/75',
                      columnClassNameMap[column.uid],
                    )}>
                    <div className='drop-shadow-xs'>{column.name}</div>
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={
                  activities.length === 0
                    ? () => (
                        <div className='px-4 py-10 text-sm text-foreground/55'>
                          No activities found
                        </div>
                      )
                    : undefined
                }>
                {activities.map((activity) => (
                  <Table.Row
                    key={activity._id}
                    id={String(activity._id)}
                    className='border-b border-light-table transition-colors last:border-b-0 data-[hovered=true]:bg-light-table/60 dark:border-dark-table dark:data-[hovered=true]:bg-origin/40'>
                    {columns.map((column) => (
                      <Table.Cell
                        key={column.uid}
                        className={cn(
                          'py-3 align-middle',
                          columnClassNameMap[column.uid],
                        )}>
                        {renderCell(activity, column.uid)}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </Card>
  )
}
