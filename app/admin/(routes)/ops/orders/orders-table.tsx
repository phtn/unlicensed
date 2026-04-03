'use client'

import {ChatWindow} from '@/components/main/chat-window'
import {DataTable} from '@/components/table-v2'
import {priceCell} from '@/components/table-v2/cells-v2'
import {ActionConfig, ColumnConfig} from '@/components/table-v2/create-column'
import {DateRangeFilter} from '@/components/table-v2/date-range'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onError} from '@/ctx/toast'
import {resolveOrderPayableTotalCents} from '@/lib/checkout/processing-fee'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Badge, Button} from '@/lib/heroui'
import type {CalendarDate} from '@internationalized/date'
import type {RangeValue} from '@react-types/shared'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useCallback, useMemo, useState} from 'react'
import {useSettingsPanel} from '../../../_components/ui/settings'
import {
  courierAssignmentCell,
  orderNumberCell,
  paymentMethodCell,
  statusCell,
} from '../components'
import type {Order} from '../types'
import {useOrderDetails} from './order-details-context'

const formatPlacedAt = (order: Order) => {
  const timestamp = order.createdAt ?? order._creationTime
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const matchesDateRange = (
  timestamp: number | undefined,
  fromDate: string,
  toDate: string,
) => {
  if (!fromDate && !toDate) return true
  if (!timestamp) return false

  const fromTimestamp = fromDate
    ? new Date(`${fromDate}T00:00:00`).getTime()
    : Number.NEGATIVE_INFINITY
  const toTimestamp = toDate
    ? new Date(`${toDate}T23:59:59.999`).getTime()
    : Number.POSITIVE_INFINITY

  return timestamp >= fromTimestamp && timestamp <= toTimestamp
}

export const OrdersTable = () => {
  const {user} = useAuthCtx()
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})
  const unreadConversations = useQuery(
    api.messages.q.getUnreadConversationSummaries,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const connectCustomerForChat = useMutation(
    api.follows.m.connectCustomerForChat,
  )
  const {setSelectedOrder} = useOrderDetails()
  const {setOpen, setOpenMobile} = useSettingsPanel()
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)
  const [chatConversationFid, setChatConversationFid] = useState<string | null>(
    null,
  )
  const [chatConversationSelectionKey, setChatConversationSelectionKey] =
    useState(0)
  const [isOpeningChat, setIsOpeningChat] = useState(false)
  const [dateRange, setDateRange] = useState<RangeValue<CalendarDate> | null>(
    null,
  )
  const fromDate = dateRange?.start.toString() ?? ''
  const toDate = dateRange?.end.toString() ?? ''

  const customerProfileIdByUserId = useMemo(() => {
    const map = new Map<string, string>()
    if (!users) return map

    for (const user of users) {
      const profileId = user.firebaseId ?? user.fid
      if (!profileId) continue
      map.set(String(user._id), profileId)
    }

    return map
  }, [users])

  const filteredOrders = useMemo(() => {
    if (!orders) {
      return []
    }

    return orders.filter((order) =>
      matchesDateRange(
        order.createdAt ?? order._creationTime,
        fromDate,
        toDate,
      ),
    )
  }, [orders, fromDate, toDate])

  const tableOrders = useMemo(
    () =>
      filteredOrders.map((order) => ({
        ...order,
        displayTotalCents: resolveOrderPayableTotalCents({
          paymentMethod: order.payment.method,
          totalCents: order.totalCents,
          processingFeeCents: order.processingFeeCents,
          totalWithCryptoFeeCents: order.totalWithCryptoFeeCents,
        }),
      })),
    [filteredOrders],
  )

  const unreadCountByParticipantId = useMemo(() => {
    const map = new Map<string, number>()
    if (!unreadConversations) return map

    for (const conversation of unreadConversations) {
      const participantId = conversation?.otherUserId
      if (!participantId) continue
      map.set(participantId, conversation.unreadCount ?? 0)
    }

    return map
  }, [unreadConversations])

  const handleViewOrder = useCallback(
    (order: Order) => {
      setSelectedOrder(order)
      setOpen(true)
      setOpenMobile(true)
    },
    [setOpen, setOpenMobile, setSelectedOrder],
  )

  const handleOpenCustomerChat = useCallback(
    async (order: Order) => {
      if (isOpeningChat) return

      if (!user?.uid) {
        onError('You must be signed in to start a chat')
        return
      }
      const targetCustomerId = order.chatUserId ?? order.userId

      if (!targetCustomerId) {
        onError('This order is not linked to a customer profile')
        return
      }

      setIsOpeningChat(true)
      try {
        const result = await connectCustomerForChat({
          customerId: targetCustomerId,
          currentUserFid: user.uid,
        })

        if (result.customerFid === user.uid) {
          onError('Cannot open chat with your own account')
          return
        }

        setChatConversationFid(result.customerFid)
        setChatConversationSelectionKey((current) => current + 1)
        setIsChatWindowOpen(true)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to open chat')
      } finally {
        setIsOpeningChat(false)
      }
    },
    [connectCustomerForChat, isOpeningChat, user?.uid],
  )

  const columns = useMemo<ColumnConfig<Order>[]>(
    () => [
      {
        id: 'status',
        header: <ColHeader tip='Status' symbol='Status' />,
        accessorKey: 'orderStatus',
        cell: statusCell(),
        size: 180,
      },
      {
        id: 'displayTotalCents',
        header: <ColHeader tip='Total Amount' symbol='Amount' center />,
        accessorKey: 'displayTotalCents' as keyof Order,
        cell: priceCell(
          'displayTotalCents' as keyof Order,
          (v) => formatPrice(+v),
          'text-right w-24! md:w-32!',
        ),
      },
      {
        id: 'method',
        header: <ColHeader tip='Payment Method' symbol='Payment' center />,
        accessorKey: 'payment',
        cell: paymentMethodCell(),
        size: 160,
      },
      {
        id: 'courier',
        header: (
          <ColHeader
            tip='Courier and account'
            symbol='Shipping Account · Courier'
            center
          />
        ),
        accessorKey: 'courier',
        cell: courierAssignmentCell(),
        size: 240,
      },
      {
        id: 'orderNumber',
        header: (
          <ColHeader
            tip='Order Number'
            symbol={
              <div className='flex'>
                <span>Order</span>
                <Icon name='hash' />
              </div>
            }
            center
          />
        ),
        accessorKey: 'orderNumber',
        cell: orderNumberCell(),
        size: 80,
      },
      {
        id: 'customer',
        header: <ColHeader tip='Customer' symbol='Customer' center />,
        accessorKey: 'contactEmail',
        cell: ({row}) => {
          const email = row.original.contactEmail
          if (!email) return <span className='text-muted-foreground'>····</span>

          const profileUserId = row.original.chatUserId ?? row.original.userId
          const profileId = profileUserId
            ? customerProfileIdByUserId.get(String(profileUserId))
            : undefined

          return (
            <div className='flex flex-col min-w-30'>
              {profileId ? (
                <Link
                  prefetch
                  href={`/admin/ops/customers/${profileId}`}
                  className='flex justify-center opacity-80 hover:opacity-100 font-okxs text-sm hover:underline underline-offset-4 decoration-dotted decoration-foreground/40 hover:decoration-blue-500 dark:hover:decoration-primary'>
                  {email?.split('@').shift()}
                </Link>
              ) : (
                <p className='tracking-tight font-medium text-xs'>
                  {email?.split('@').shift()}
                </p>
              )}
            </div>
          )
        },
        size: 160,
      },
      {
        id: 'date',
        header: <ColHeader tip='Order placed date and time' symbol='Placed' />,
        accessorKey: 'createdAt',
        size: 180,
        cell: ({row}) => (
          <span className='text-sm'>{formatPlacedAt(row.original)}</span>
        ),
      },
    ],
    [customerProfileIdByUserId],
  )

  const clearDateRange = useCallback(() => {
    setDateRange(null)
  }, [])

  const dateRangeControl = useMemo(
    () => (
      <div className='flex flex-wrap items-center gap-2 md:flex-nowrap'>
        <DateRangeFilter
          ariaLabel='Filter orders by placed date'
          value={dateRange}
          onChange={setDateRange}
        />
        {dateRange ? (
          <Button
            size='sm'
            variant='tertiary'
            className='h-9 min-w-0 rounded-md px-3'
            onPress={clearDateRange}>
            Clear
          </Button>
        ) : null}
      </div>
    ),
    [clearDateRange, dateRange],
  )

  const actionConfig = useMemo(
    () =>
      ({
        mode: 'custom',
        render: ({row}) => {
          const order = row.original
          const customerProfileId = order.chatUserId ?? order.userId
          const unreadCount = customerProfileId
            ? (unreadCountByParticipantId.get(String(customerProfileId)) ?? 0)
            : 0

          return (
            <div className='flex w-full items-center justify-end gap-1 pr-1'>
              <Badge
                key={`orders-chat-badge-${String(order._id)}-${unreadCount}`}
                content={
                  unreadCount > 0 ? (
                    <span className='font-okxs font-semibold text-white leading-none'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  ) : undefined
                }
                isInvisible={unreadCount === 0}
                classNames={{
                  badge:
                    'min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-1.5 dark:border-background/90 shadow-md bg-brand/80',
                }}>
                <Button
                  isIconOnly
                  size='sm'
                  variant='tertiary'
                  isDisabled={isOpeningChat}
                  className='h-8 w-8 min-w-8 rounded-lg'
                  onPress={() => {
                    void handleOpenCustomerChat(order)
                  }}>
                  <Icon name='message-filled' className='size-4.5 opacity-80' />
                </Button>
              </Badge>
              <Button
                isIconOnly
                size='sm'
                variant='tertiary'
                className='h-8 w-8 min-w-8 rounded-lg'
                onPress={() => handleViewOrder(order)}>
                <Icon name='details' className='size-4.5' />
              </Button>
            </div>
          )
        },
      }) as ActionConfig<Order>,
    [
      handleOpenCustomerChat,
      handleViewOrder,
      isOpeningChat,
      unreadCountByParticipantId,
    ],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {chatConversationFid && (
        <ChatWindow
          open={isChatWindowOpen}
          onOpenChange={setIsChatWindowOpen}
          conversationFid={chatConversationFid}
          conversationSelectionKey={chatConversationSelectionKey}
        />
      )}
      <DataTable
        title='Orders'
        data={tableOrders}
        loading={!orders}
        columnConfigs={columns}
        actionConfig={actionConfig}
        editingRowId={null}
        defaultPageSize={50}
        centerToolbarDateRange={dateRangeControl}
      />
    </div>
  )
}
