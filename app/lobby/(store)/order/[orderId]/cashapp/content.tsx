'use client'

import {
  ArcActionBar,
  ArcButtonLeft,
  ArcButtonRight,
  ArcCallout,
  ArcCard,
  ArcHeader,
  ArcLineItems,
  ArcMessage,
} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {useMutation, useQuery} from 'convex/react'
import {useParams} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'

function scoreStaffForCashAppRep(staff: {
  division?: string
  position: string
  accessRoles: string[]
}) {
  const division = (staff.division ?? '').toLowerCase()
  const position = (staff.position ?? '').toLowerCase()
  const roles = staff.accessRoles.map((role) => role.toLowerCase())

  let score = 0
  if (division.includes('payment') || division.includes('billing')) score += 6
  if (
    position.includes('payment') ||
    position.includes('billing') ||
    position.includes('support')
  ) {
    score += 4
  }
  if (roles.includes('admin') || roles.includes('manager')) score += 3
  if (roles.includes('staff')) score += 1

  return score
}

export const Content = () => {
  const {user} = useAuthCtx()
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const order = useQuery(api.orders.q.getById, {id: orderId})
  const currentUser = useQuery(
    api.users.q.getCurrentUser,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const staff = useQuery(api.staff.q.getStaff)
  const connectStaffForChat = useMutation(api.follows.m.connectStaffForChat)
  const sendMessage = useMutation(api.messages.m.sendMessage)

  const [assignedRepFid, setAssignedRepFid] = useState<string | null>(null)
  const [isConnectingRep, setIsConnectingRep] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const seededOrderRef = useRef<string | null>(null)

  const assignedRep = useQuery(
    api.users.q.getCurrentUser,
    assignedRepFid ? {fid: assignedRepFid} : 'skip',
  )

  const conversationMessages = useQuery(
    api.messages.q.getMessages,
    user?.uid && assignedRepFid
      ? {
          currentUserId: user.uid,
          otherUserId: assignedRepFid,
        }
      : 'skip',
  )

  const isOrderOwner = useMemo(() => {
    if (!order || !currentUser) return false
    return order.userId === currentUser._id
  }, [currentUser, order])

  const staffCandidates = useMemo(() => {
    if (!staff) return []

    return [...staff]
      .filter((member) => member.active)
      .sort((a, b) => {
        const scoreDelta =
          scoreStaffForCashAppRep(b) - scoreStaffForCashAppRep(a)
        if (scoreDelta !== 0) return scoreDelta
        return a.createdAt - b.createdAt
      })
  }, [staff])

  const isCashAppOrder = order?.payment.method === 'cash_app'
  const noStaffConfigured =
    !!order &&
    isCashAppOrder &&
    !!user?.uid &&
    !!currentUser &&
    isOrderOwner &&
    staff !== undefined &&
    staffCandidates.length === 0

  const canAttemptRepConnection =
    !!order &&
    isCashAppOrder &&
    !!user?.uid &&
    !!currentUser &&
    isOrderOwner &&
    !assignedRepFid &&
    !isConnectingRep &&
    !connectionError &&
    staffCandidates.length > 0

  useEffect(() => {
    if (!canAttemptRepConnection || !user?.uid) return

    let cancelled = false

    const connect = async () => {
      setIsConnectingRep(true)
      setConnectionError(null)

      let nextRepFid: string | null = null

      for (const candidate of staffCandidates) {
        try {
          const result = await connectStaffForChat({
            staffId: candidate._id,
            currentUserFid: user.uid,
          })
          if (result.staffUserFid) {
            nextRepFid = result.staffUserFid
            break
          }
        } catch {
          // Try next active staff member
        }
      }

      if (cancelled) return

      if (nextRepFid) {
        setAssignedRepFid(nextRepFid)
      } else {
        setConnectionError(
          'No chat-enabled representative account is available right now. Please try again shortly.',
        )
      }

      setIsConnectingRep(false)
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [
    canAttemptRepConnection,
    connectStaffForChat,
    staffCandidates,
    user?.uid,
  ])

  useEffect(() => {
    if (
      !order ||
      !currentUser ||
      !user?.uid ||
      !assignedRepFid ||
      !conversationMessages
    ) {
      return
    }

    if (!isOrderOwner) return
    if (seededOrderRef.current === order._id) return

    const starterMessage = `Cash App checkout request for order ${order.orderNumber}. I selected Cash App and need a representative to continue payment in this chat.`

    const hasStarterMessage = conversationMessages.some(
      (message) =>
        message.senderId === currentUser._id &&
        message.content.includes(
          `Cash App checkout request for order ${order.orderNumber}`,
        ),
    )

    if (hasStarterMessage) {
      seededOrderRef.current = order._id
      return
    }

    let cancelled = false

    const seedConversation = async () => {
      try {
        await sendMessage({
          senderId: user.uid,
          receiverId: assignedRepFid,
          content: starterMessage,
        })
        if (!cancelled) {
          seededOrderRef.current = order._id
        }
      } catch (error) {
        console.error('Failed to seed Cash App chat message:', error)
      }
    }

    seedConversation()

    return () => {
      cancelled = true
    }
  }, [
    assignedRepFid,
    conversationMessages,
    currentUser,
    isOrderOwner,
    order,
    sendMessage,
    user?.uid,
  ])

  const setupState = useMemo<
    'idle' | 'connecting' | 'ready' | 'needs_auth' | 'not_owner' | 'no_rep' | 'error'
  >(() => {
    if (!order) return 'idle'
    if (!isCashAppOrder) return 'error'
    if (!user?.uid) return 'needs_auth'
    if (!currentUser) return 'connecting'
    if (!isOrderOwner) return 'not_owner'
    if (assignedRepFid) return 'ready'
    if (isConnectingRep) return 'connecting'
    if (noStaffConfigured || connectionError) return 'no_rep'
    return 'connecting'
  }, [
    assignedRepFid,
    connectionError,
    currentUser,
    isCashAppOrder,
    isConnectingRep,
    isOrderOwner,
    noStaffConfigured,
    order,
    user?.uid,
  ])

  const setupError = useMemo(() => {
    if (setupState === 'error') {
      return 'This order is not configured for Cash App support.'
    }
    if (setupState === 'not_owner') {
      return 'Sign in with the account that placed this order to continue in chat.'
    }
    if (setupState === 'no_rep') {
      return (
        connectionError ?? 'No active payment representatives are available right now.'
      )
    }
    return null
  }, [connectionError, setupState])

  const data = useMemo(
    () =>
      order
        ? [
            ...order.items.map((item) => ({
              label: item.productName,
              value: `$${formatPrice(item.unitPriceCents)}`,
            })),
            {
              label: 'Payment Method',
              value: order.payment.method.split('_').join(' '),
            },
            ...(setupState === 'ready'
              ? [
                  {
                    label: 'Assigned Rep',
                    value:
                      assignedRep?.name ??
                      assignedRep?.email?.split('@')[0] ??
                      'Support',
                  },
                ]
              : []),
          ]
        : [],
    [assignedRep?.email, assignedRep?.name, order, setupState],
  )

  const chatMessage = useMemo(() => {
    if (setupState === 'ready') {
      const repName =
        assignedRep?.name ?? assignedRep?.email?.split('@')[0] ?? 'a rep'
      return `${repName} is assigned and will continue your payment in chat.`
    }
    if (setupState === 'connecting') {
      return 'Connecting you to the next available payment representative...'
    }
    if (setupState === 'needs_auth') {
      return 'Sign in to continue Cash App payment through in-app chat.'
    }
    if (setupState === 'not_owner') {
      return (
        setupError ??
        'This order belongs to a different account. Sign in with the correct account.'
      )
    }
    if (setupState === 'no_rep' || setupState === 'error') {
      return setupError ?? 'We could not connect chat support for this order.'
    }
    return 'Preparing your payment chat...'
  }, [assignedRep?.email, assignedRep?.name, setupError, setupState])

  const chatCalloutType = useMemo(() => {
    if (setupState === 'ready') return 'success' as const
    if (setupState === 'connecting' || setupState === 'idle') return 'info' as const
    if (setupState === 'needs_auth') return 'warning' as const
    return 'error' as const
  }, [setupState])

  const chatHref = assignedRepFid ? `/account/chat/${assignedRepFid}` : '/account/chat'
  const chatLabel = setupState === 'ready' ? 'Open Chat' : 'Chat Inbox'

  const orderHref = order ? `/account/orders/${order.orderNumber}` : '#'
  const paymentStatus =
    setupState === 'ready'
      ? 'Rep Connected'
      : setupState === 'connecting'
        ? 'Connecting Rep'
        : 'Pending Payment'

  const paymentStatusStyle =
    setupState === 'ready'
      ? 'font-brk text-emerald-300 tracking-wide uppercase text-xs bg-background/60 py-1 px-1.5 rounded-sm'
      : 'font-brk text-orange-300 tracking-wide uppercase text-xs bg-background/60 py-1 px-1.5 rounded-sm'

  const isLoadingOrder = order === undefined

  return (
    <main className='h-[calc(100lvh)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8 bg-black'>
      <ArcCard>
        <ArcHeader
          title='We received your order!'
          description={order?.orderNumber}
          icon='hash'
          iconStyle='text-indigo-400'
          status={
            <span className={paymentStatusStyle}>
              {isLoadingOrder ? 'Loading' : paymentStatus}
            </span>
          }
        />
        <ArcLineItems data={data} />

        <ArcCallout icon='info' value={chatMessage} type={chatCalloutType} />

        <div className='hidden _flex items-center space-x-2 text-base'>
          <Icon name='info' className='size-5' />
          <ArcMessage>
            <div className='flex items-center text-left space-x-2 text-base'>
              <span>
                One of our associates will be in touch via our in-app{' '}
                <span className='font-medium underline decoration-dotted'>
                  chat messaging
                </span>
                .
              </span>
            </div>
          </ArcMessage>
        </div>
        <ArcActionBar>
          <ArcButtonLeft icon='chevron-left' label='View Order' href={orderHref} />
          <ArcButtonRight icon='chat-rounded' label={chatLabel} href={chatHref} />
        </ArcActionBar>
      </ArcCard>
    </main>
  )
}
