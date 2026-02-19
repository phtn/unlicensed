'use client'

import {ChatWindow} from '@/components/main/chat-window'
import {DataTable} from '@/components/table-v2'
import {priceCell} from '@/components/table-v2/cells-v2'
import {ActionConfig, ColumnConfig} from '@/components/table-v2/create-column'
import {ColHeader} from '@/components/table-v2/headers'
import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
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

export const OrdersTable = () => {
  const {user} = useAuthCtx()
  const orders = useQuery(api.orders.q.getRecentOrders, {limit: 100})
  const users = useQuery(api.users.q.getAllUsers, {limit: 5000})
  const followForChat = useMutation(api.follows.m.follow)
  const conversations = useQuery(
    api.messages.q.getConversations,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const {setSelectedOrder} = useOrderDetails()
  const {setOpen, setOpenMobile} = useSettingsPanel()
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false)
  const [chatConversationFid, setChatConversationFid] = useState<string | null>(
    null,
  )
  const [isOpeningChat, setIsOpeningChat] = useState(false)

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
      if (!order.userId) {
        onError('This order is not linked to a customer profile')
        return
      }

      const customerFid = customerProfileIdByUserId.get(String(order.userId))
      if (!customerFid) {
        onError('Customer does not have a chat profile ID')
        return
      }
      if (customerFid === user.uid) {
        onError('Cannot open chat with your own account')
        return
      }

      setIsOpeningChat(true)
      try {
        const hasExistingConversation =
          conversations?.some(
            (conversation) => conversation?.otherUser?.fid === customerFid,
          ) ?? false

        if (!hasExistingConversation) {
          await followForChat({
            followedId: order.userId,
            followerId: user.uid,
          })
          onSuccess('Chat room created')
        }

        setChatConversationFid(customerFid)
        setIsChatWindowOpen(true)
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to open chat')
      } finally {
        setIsOpeningChat(false)
      }
    },
    [
      conversations,
      customerProfileIdByUserId,
      followForChat,
      isOpeningChat,
      user?.uid,
    ],
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
        id: 'totalCents',
        header: <ColHeader tip='Total Amount' symbol='Amount' center />,
        accessorKey: 'totalCents',
        cell: priceCell('totalCents', (v) => formatPrice(+v)),
        size: 120,
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
            symbol='Courier · Account'
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
        size: 60,
      },
      {
        id: 'customer',
        header: <ColHeader tip='Customer' symbol='Customer' center />,
        accessorKey: 'contactEmail',
        cell: ({row}) => {
          const email = row.original.contactEmail
          if (!email) return <span className='text-muted-foreground'>····</span>

          const profileId = row.original.userId
            ? customerProfileIdByUserId.get(String(row.original.userId))
            : undefined

          return (
            <div className='flex flex-col'>
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
        size: 140,
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

  const actionConfig = useMemo(
    () =>
      ({
        mode: 'buttons',
        align: 'end',
        actions: [
          {
            id: 'chat',
            label: '',
            icon: 'chat',
            appearance: 'icon-button',
            onClick: (order: Order) => {
              void handleOpenCustomerChat(order)
            },
          },
          {
            id: 'view',
            label: '',
            icon: 'details',
            appearance: 'icon-button',
            onClick: (order: Order) => handleViewOrder(order),
          },
        ],
      }) as ActionConfig<Order>,
    [handleOpenCustomerChat, handleViewOrder],
  )

  return (
    <div className='relative w-full max-w-full overflow-hidden'>
      {chatConversationFid && (
        <ChatWindow
          open={isChatWindowOpen}
          onOpenChange={setIsChatWindowOpen}
          conversationFid={chatConversationFid}
        />
      )}
      <DataTable
        title='Orders'
        data={orders ?? []}
        loading={!orders}
        columnConfigs={columns}
        actionConfig={actionConfig}
        editingRowId={null}
      />
    </div>
  )
}
