// 'use client'

// import {api} from '@/convex/_generated/api'
// import type {Doc} from '@/convex/_generated/dataModel'
// import {useAuth} from '@/hooks/use-auth'
// import {Icon} from '@/lib/icons'
// import {cn} from '@/lib/utils'
// import {formatTimestamp} from '@/utils/date'
// import {Avatar} from '@heroui/avatar'
// import {
//   Card,
//   Chip,
//   ChipProps,
//   Table,
//   TableBody,
//   TableCell,
//   TableColumn,
//   TableHeader,
//   TableRow,
// } from '@heroui/react'
// import {useMutation, useQuery} from 'convex/react'
// import React, {ReactNode, useEffect} from 'react'

// import {LegacyImage} from '@/components/ui/legacy-image'

// type Activity = Doc<'activities'>

// const columns = [
//   {name: 'USER', uid: 'user'},
//   {name: 'ACTIVITY', uid: 'activity'},
//   {name: 'TYPE', uid: 'type'},
//   {name: 'DETAILS', uid: 'details'},
//   {name: 'SEEN BY', uid: 'seenBy'},
//   {name: 'TIME', uid: 'time'},
// ]

// const getActivityIcon = (type: Activity['type']) => {
//   switch (type) {
//     case 'user_signup':
//       return 'user'
//     case 'order_created':
//     case 'order_confirmed':
//     case 'order_processing':
//     case 'order_shipped':
//     case 'order_delivered':
//       return 'bag-light'
//     case 'order_cancelled':
//     case 'order_refunded':
//       return 'x'
//     case 'payment_completed':
//       return 'plus'
//     case 'payment_failed':
//       return 'x'
//     case 'product_created':
//     case 'product_updated':
//       return 'bag-solid'
//     case 'category_created':
//     case 'category_updated':
//       return 'eye'
//     default:
//       return 'eye'
//   }
// }

// const getActivityIconColor = (type: Activity['type']) => {
//   if (type.startsWith('order_')) {
//     if (type.includes('delivered')) return 'text-dark-gray dark:text-limited '
//     if (type.includes('cancelled') || type.includes('refunded'))
//       return 'text-red-500'
//     return 'text-featured'
//   }
//   if (type.startsWith('payment_')) {
//     if (type.includes('completed')) return 'text-deal'
//     if (type.includes('failed')) return 'text-red-500'
//     return 'text-yellow-500'
//   }
//   if (type.startsWith('user_')) return 'text-brand'
//   if (type.startsWith('product_')) return 'text-cyan-500'
//   if (type.startsWith('category_')) return 'text-orange-500'
//   return 'text-gray-500'
// }

// const getActivityChipColor = (type: Activity['type']): ChipProps['color'] => {
//   if (type.startsWith('order_')) {
//     if (type.includes('delivered')) return 'success'
//     if (type.includes('cancelled') || type.includes('refunded')) return 'danger'
//     return 'accent'
//   }
//   if (type.startsWith('payment_')) {
//     if (type.includes('completed')) return 'success'
//     if (type.includes('failed')) return 'danger'
//     return 'warning'
//   }
//   if (type.startsWith('user_')) return 'default'
//   if (type.startsWith('product_')) return 'default'
//   if (type.startsWith('category_')) return 'default'
//   return 'default'
// }

// const getActivityTypeLabel = (type: Activity['type']) => {
//   return type
//     .split('_')
//     .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//     .join(' ')
// }

// interface RecentActivitiesProps {
//   fullTable: boolean
//   toggleFullTable: VoidFunction
// }

// export const RecentActivities = ({
//   fullTable,
//   toggleFullTable,
// }: RecentActivitiesProps) => {
//   const {convexUserId} = useAuth()
//   const markAsViewed = useMutation(api.activityViews.m.markActivitiesAsViewed)
//   const viewedActivityIdsRef = React.useRef<Set<string>>(new Set())

//   const activities = useQuery(api.activities.q.getRecentActivities, {
//     limit: 10,
//     includeUsers: true,
//     includeViewers: true,
//     viewerLimit: 5,
//   })

//   // Mark activities as viewed when component mounts or activities change
//   useEffect(() => {
//     viewedActivityIdsRef.current = new Set()
//   }, [convexUserId])

//   useEffect(() => {
//     if (!activities || !convexUserId) return

//     const unseenActivityIds = activities
//       .map((activity) => activity._id)
//       .filter(
//         (activityId) => !viewedActivityIdsRef.current.has(String(activityId)),
//       )

//     if (unseenActivityIds.length === 0) return

//     unseenActivityIds.forEach((activityId) => {
//       viewedActivityIdsRef.current.add(String(activityId))
//     })

//     markAsViewed({
//       activityIds: unseenActivityIds,
//       userId: convexUserId,
//     }).catch(() => {
//       unseenActivityIds.forEach((activityId) => {
//         viewedActivityIdsRef.current.delete(String(activityId))
//       })
//     })
//   }, [activities, convexUserId, markAsViewed])

//   const renderCell = React.useCallback(
//     (
//       activity: Activity & {
//         user?: {name: string; email: string; photoUrl?: string} | null
//         viewers?: Array<{
//           userId: string
//           name: string
//           email: string
//           photoUrl?: string
//         }>
//         viewerCount?: number
//       },
//       columnKey: React.Key,
//     ) => {
//       const cellValue = activity[columnKey as keyof Activity]

//       switch (columnKey) {
//         case 'user':
//           if (activity.user) {
//             return (
//               <div className='flex items-center gap-2'>
//                 <Avatar
//                   src={activity.user.photoUrl}
//                   size='sm'
//                   className='shrink-0'
//                 />
//                 <div>
//                   <p className='text-sm font-medium'>{activity.user.name}</p>
//                 </div>
//               </div>
//             )
//           }
//           return (
//             <div className='flex items-center gap-2'>
//               <div className='flex h-8 w-8 items-center justify-center rounded-full bg-default-100'>
//                 <Icon name='eye' className='w-4 h-4 text-default-400' />
//               </div>
//               <div className='flex flex-col'>
//                 <p className='text-bold text-small text-default-400'>System</p>
//               </div>
//             </div>
//           )
//         // case 'amount':
//         //   return (
//         //     <div className='capitalize border-none gap-1 text-default-600'>
//         //       {activity.metadata?.orderTotalCents && (
//         //         <p className='font-bold text-tiny font-space'>
//         //           {formatPrice(activity.metadata.orderTotalCents)}
//         //         </p>
//         //       )}
//         //     </div>
//         //   )
//         case 'activity':
//           return (
//             <div className='flex items-center gap-3'>
//               <div
//                 className={`shrink-0 ${getActivityIconColor(activity.type)}`}
//               >
//                 <Icon
//                   name={getActivityIcon(activity.type)}
//                   className='w-5 h-5'
//                 />
//               </div>
//               <div className='flex flex-col'>
//                 <p className='text-bold text-small text-foreground'>
//                   {activity.title}
//                 </p>
//                 {/*{activity.description && (
//                   <p className='hidden text-bold text-tiny text-default-500'>
//                     {activity.description}
//                   </p>
//                 )}*/}
//               </div>
//             </div>
//           )
//         case 'type':
//           return (
//             <Chip
//               className='capitalize border-none gap-1 text-default-600'
//               color={getActivityChipColor(activity.type)}
//               size='sm'
//               variant='soft'
//             >
//               {getActivityTypeLabel(activity.type)}
//             </Chip>
//           )
//         case 'details':
//           return (
//             <div className='flex flex-col'>
//               {activity.metadata?.orderNumber && (
//                 <p className='text-bold text-small capitalize'>
//                   Order: {activity.metadata.orderNumber}
//                 </p>
//               )}
//               {activity.metadata?.productName && (
//                 <p className='text-bold text-small capitalize'>
//                   {activity.metadata.productName}
//                 </p>
//               )}
//               {activity.metadata?.categoryName && (
//                 <p className='text-bold text-small capitalize'>
//                   {activity.metadata.categoryName}
//                 </p>
//               )}
//               {!activity.metadata?.orderNumber &&
//                 !activity.metadata?.productName &&
//                 !activity.metadata?.categoryName && (
//                   <p className='text-bold text-tiny text-default-500'>—</p>
//                 )}
//             </div>
//           )
//         case 'seenBy':
//           const viewers = activity.viewers || []
//           const totalViewers = activity.viewerCount ?? viewers.length
//           if (viewers.length === 0) {
//             return (
//               <p className='text-bold text-tiny text-default-400'>Not viewed</p>
//             )
//           }
//           return (
//             <div className='flex items-center gap-1'>
//               {viewers.slice(0, 5).map((viewer) => (
//                 <div
//                   key={viewer.userId}
//                   className='shrink-0'
//                   title={`${viewer.name} (${viewer.email})`}
//                 >
//                   <div className='flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-default-100 ring-1 ring-white'>
//                     {viewer.photoUrl ? (
//                       <LegacyImage
//                         src={viewer.photoUrl}
//                         alt={viewer.name}
//                         className='h-full w-full object-cover'
//                       />
//                     ) : (
//                       <span className='text-xs font-medium text-default-600'>
//                         {viewer.name.charAt(0).toUpperCase()}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//               {totalViewers > viewers.length && (
//                 <div className='flex h-8 w-8 items-center justify-center rounded-full bg-default-100 ring-2 ring-background'>
//                   <span className='text-xs font-medium text-default-600'>
//                     +{totalViewers - viewers.length}
//                   </span>
//                 </div>
//               )}
//             </div>
//           )
//         case 'time':
//           return (
//             <p className='text-bold text-small text-default-500'>
//               {formatTimestamp(activity.createdAt)}
//             </p>
//           )
//         default:
//           return cellValue
//       }
//     },
//     [],
//   )

//   const classNames = React.useMemo(
//     () => ({
//       // wrapper: ['h-[calc(100vh-240px)] overflow-scroll', 'max-w-full'],
//       // th: ['bg-transparent', 'text-default-500', 'border-b', 'border-divider'],
//       td: [
//         'first:group-data-[first=true]/tr:before:rounded-none',
//         'last:group-data-[first=true]/tr:before:rounded-none',
//         'group-data-[middle=true]/tr:before:rounded-none',
//         'first:group-data-[last=true]/tr:before:rounded-none',
//         'last:group-data-[last=true]/tr:before:rounded-none',
//       ],
//       tbody: '',
//     }),
//     [],
//   )

//   if (activities === undefined) {
//     return (
//       <Card className='p-4 dark:bg-dark-table/60'>
//         <div className='flex items-center justify-center py-8'>
//           <p className='text-sm text-gray-400'>Loading activities...</p>
//         </div>
//       </Card>
//     )
//   }

//   if (activities.length === 0) {
//     return (
//       <Card className='p-4 dark:bg-dark-table/60'>
//         <h2 className='text-lg font-semibold font-space mb-4 px-4'>
//           Recent Activity
//         </h2>
//         <div className='flex items-center justify-center py-8'>
//           <p className='text-sm text-gray-400'>No activities yet</p>
//         </div>
//       </Card>
//     )
//   }

//   return (
//     <Card
//       className={cn(
//         'dark:bg-dark-table/40 bg-light-table/0 overflow-hidden rounded-t-2xl',
//         'transition-transform duration-300',
//         {'-translate-y-46 h-full': fullTable},
//       )}
//     >
//       <div
//         className={cn(
//           'md:h-[calc(100lvh-203px)] overflow-scroll transition-transform duration-300',
//           {
//             'md:h-[calc(100lvh-66px)]': fullTable,
//           },
//         )}
//       >
//         <div className='flex items-end justify-between text-sm font-medium px-3 py-2'>
//           <span>Recent Activity</span>
//           <Icon
//             name='fullscreen'
//             className='size-4.5 opacity-60 hover:opacity-100'
//             onClick={toggleFullTable}
//           />
//         </div>
//         <Table
//           aria-label='Recent activities table'
//         >
//           <TableHeader columns={columns}>
//             {(column) => (
//               <TableColumn
//                 key={column.uid}
//                 className='tracking-wider text-xs font-medium'
//               >
//                 <div className='drop-shadow-xs'>{column.name}</div>
//               </TableColumn>
//             )}
//           </TableHeader>
//           <TableBody items={activities}>
//             {(activity) => (
//               <TableRow
//                 key={String(activity._id)}
//                 className='h-8 hover:bg-light-table/60 dark:hover:bg-origin/40 border-b-[0.33px] border-b-light-table last:border-b-0 dark:border-b-dark-table'
//               >
//                 {(columnKey) => (
//                   <TableCell>
//                     {renderCell(activity, columnKey as unknown as React.Key) as ReactNode}
//                   </TableCell>
//                 )}
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </Card>
//   )
// }
