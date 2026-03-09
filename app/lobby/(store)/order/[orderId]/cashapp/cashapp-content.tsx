'use client'

import {ArcCard, ArcHeader} from '@/components/expermtl/arc-card'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {toggleChatDockWindow} from '@/lib/chat-dock'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Chip, Divider} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams} from 'next/navigation'
import {useEffect, useMemo, useRef, useState} from 'react'

type StepState = 'complete' | 'active' | 'pending' | 'error'

const PAYMENT_CONFIRMED_ORDER_STATUSES = new Set([
  'order_processing',
  'awaiting_courier_pickup',
  'shipped',
  'delivered',
  'resend',
])

type SalesRepValue = {staffId?: string; initialMessageSeed?: string}

function stepIconName(state: StepState) {
  if (state === 'complete') return 'check-fill'
  if (state === 'active') return 'spinners-ring'
  if (state === 'error') return 'x'
  return 'hash'
}

function StepRow({
  title,
  description,
  state,
}: {
  title: string
  description: string
  state: StepState
}) {
  return (
    <div className='flex items-start gap-3'>
      <div
        className={cn(
          'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border',
          {
            'border-cashapp/60 bg-emerald-500/15 text-emerald-300':
              state === 'complete',
            'border-orange-400/60 bg-orange-500/15 text-orange-300':
              state === 'active',
            'border-rose-400/60 bg-rose-500/15 text-rose-300':
              state === 'error',
            'border-foreground/20 bg-foreground/5 text-foreground/60':
              state === 'pending',
          },
        )}>
        <Icon
          name={stepIconName(state)}
          className={cn('size-4', {
            'animate-spin': state === 'active',
          })}
        />
      </div>
      <div className='space-y-0.5'>
        <p className='text-sm font-okxs tracking-tight'>{title}</p>
        <p className='text-xs opacity-70'>{description}</p>
      </div>
    </div>
  )
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
  const salesRepSetting = useQuery(api.admin.q.getAdminByIdentifier, {
    identifier: 'sales-rep',
  })
  const connectStaffForChat = useMutation(api.follows.m.connectStaffForChat)
  const sendMessage = useMutation(api.messages.m.sendMessage)
  const sendAssistantMessage = useMutation(api.assistant.m.sendAssistantMessage)

  const [chatConnection, setChatConnection] = useState<{
    orderId: string
    repFid: string | null
    isConnecting: boolean
    error: string | null
  }>({
    orderId: '',
    repFid: null,
    isConnecting: false,
    error: null,
  })

  const assignedRepFid =
    chatConnection.orderId === orderId ? chatConnection.repFid : null
  const isConnectingRep =
    chatConnection.orderId === orderId ? chatConnection.isConnecting : false
  const connectionError =
    chatConnection.orderId === orderId ? chatConnection.error : null

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

  const assistantMessages = useQuery(
    api.assistant.q.getAssistantMessages,
    user?.uid ? {fid: user.uid} : 'skip',
  )

  const isOrderOwner = useMemo(() => {
    if (!order || !currentUser) return false
    return order.userId === currentUser._id
  }, [currentUser, order])

  const settingsValue = useMemo((): SalesRepValue | undefined => {
    if (!salesRepSetting?.value || typeof salesRepSetting.value !== 'object')
      return undefined
    return salesRepSetting.value as SalesRepValue
  }, [salesRepSetting])

  const defaultSalesRepStaffId = useMemo((): Id<'staff'> | null => {
    const staffId = settingsValue?.staffId
    return staffId ? (staffId as Id<'staff'>) : null
  }, [settingsValue])

  const initialMessageSeedTemplate = useMemo(() => {
    const template = settingsValue?.initialMessageSeed?.trim()
    if (template) return template
    return 'Cash App checkout request for order {orderNumber}. I selected Cash App and need a representative to continue payment in this chat.'
  }, [settingsValue])

  const isCashAppOrder = order?.payment.method === 'cash_app'
  const isPaymentConfirmed =
    !!order &&
    (order.payment.status === 'completed' ||
      PAYMENT_CONFIRMED_ORDER_STATUSES.has(order.orderStatus))
  const noStaffConfigured =
    !!order &&
    isCashAppOrder &&
    !!user?.uid &&
    !!currentUser &&
    isOrderOwner &&
    salesRepSetting !== undefined &&
    !defaultSalesRepStaffId

  const canAttemptRepConnection =
    !!order &&
    isCashAppOrder &&
    !!user?.uid &&
    !!currentUser &&
    isOrderOwner &&
    !assignedRepFid &&
    !isConnectingRep &&
    !connectionError &&
    !!defaultSalesRepStaffId

  useEffect(() => {
    if (!canAttemptRepConnection || !user?.uid || !defaultSalesRepStaffId)
      return

    let cancelled = false

    const connect = async () => {
      setChatConnection({
        orderId,
        repFid: null,
        isConnecting: true,
        error: null,
      })

      try {
        const result = await connectStaffForChat({
          staffId: defaultSalesRepStaffId,
          currentUserFid: user.uid,
        })
        if (cancelled) return
        if (result.staffUserFid) {
          setChatConnection({
            orderId,
            repFid: result.staffUserFid,
            isConnecting: false,
            error: null,
          })
        } else {
          setChatConnection({
            orderId,
            repFid: null,
            isConnecting: false,
            error:
              'Default sales representative is not available. Please try again shortly.',
          })
        }
      } catch {
        if (cancelled) return
        setChatConnection({
          orderId,
          repFid: null,
          isConnecting: false,
          error:
            'No chat-enabled representative account is available right now. Please try again shortly.',
        })
      }
    }

    connect()

    return () => {
      cancelled = true
    }
  }, [
    canAttemptRepConnection,
    connectStaffForChat,
    defaultSalesRepStaffId,
    orderId,
    user?.uid,
  ])

  const hasStarterMessage = useMemo(() => {
    if (!order || !currentUser || !conversationMessages) return false
    return conversationMessages.some(
      (message) =>
        message.senderId === currentUser._id &&
        message.content.includes(order.orderNumber),
    )
  }, [conversationMessages, currentUser, order])

  const expectedInitialMessage = useMemo(
    () =>
      initialMessageSeedTemplate.replace(
        '{orderNumber}',
        order?.orderNumber ?? '',
      ),
    [initialMessageSeedTemplate, order?.orderNumber],
  )

  const assistantLastMessageContent = useMemo(() => {
    if (!assistantMessages?.length) return undefined
    const fromAssistant = assistantMessages.filter(
      (m) => m.role === 'assistant',
    )
    const last = fromAssistant[fromAssistant.length - 1]
    return last?.content
  }, [assistantMessages])

  const shouldSendAssistantInitialMessage = useMemo(
    () =>
      !assistantMessages?.length ||
      assistantLastMessageContent !== expectedInitialMessage,
    [
      assistantMessages?.length,
      assistantLastMessageContent,
      expectedInitialMessage,
    ],
  )

  const seededAssistantOrderRef = useRef<string | null>(null)

  useEffect(() => {
    if (
      !order ||
      !currentUser ||
      !user?.uid ||
      !isCashAppOrder ||
      !isOrderOwner ||
      !shouldSendAssistantInitialMessage
    ) {
      return
    }
    if (seededAssistantOrderRef.current === order._id) return

    const assistantMessage = expectedInitialMessage
    let cancelled = false

    const seedAssistant = async () => {
      try {
        await sendAssistantMessage({
          fid: user.uid,
          content: assistantMessage,
          isFromAssistant: true,
        })
        if (!cancelled) {
          seededAssistantOrderRef.current = order._id
        }
      } catch (error) {
        console.error('Failed to seed Cash App assistant message:', error)
      }
    }

    seedAssistant()

    return () => {
      cancelled = true
    }
  }, [
    expectedInitialMessage,
    isCashAppOrder,
    isOrderOwner,
    order,
    sendAssistantMessage,
    shouldSendAssistantInitialMessage,
    user?.uid,
    currentUser,
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
    if (hasStarterMessage) {
      seededOrderRef.current = order._id
      return
    }
    if (seededOrderRef.current === order._id) return

    const starterMessage = initialMessageSeedTemplate.replace(
      '{orderNumber}',
      order.orderNumber,
    )

    let cancelled = false

    const seedRepConversation = async () => {
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

    seedRepConversation()

    return () => {
      cancelled = true
    }
  }, [
    assignedRepFid,
    conversationMessages,
    currentUser,
    hasStarterMessage,
    initialMessageSeedTemplate,
    isOrderOwner,
    order,
    sendMessage,
    user?.uid,
  ])

  const setupState = useMemo<
    | 'idle'
    | 'connecting'
    | 'ready'
    | 'needs_auth'
    | 'not_owner'
    | 'no_rep'
    | 'error'
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
        connectionError ??
        'No active payment representatives are available right now.'
      )
    }
    return null
  }, [connectionError, setupState])

  const _chatMessage = useMemo(() => {
    if (setupState === 'ready') {
      const repName =
        assignedRep?.name ?? assignedRep?.email?.split('@')[0] ?? 'a rep'
      return `${repName} is assigned. Open chat now to complete your Cash App handoff.`
    }
    if (setupState === 'connecting') {
      return 'We are matching your order with the next available representative.'
    }
    if (setupState === 'needs_auth') {
      return 'Sign in to continue the Cash App checkout in live chat.'
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
    return 'Preparing your checkout handoff...'
  }, [assignedRep?.email, assignedRep?.name, setupError, setupState])

  const _chatCalloutType = useMemo(() => {
    if (setupState === 'ready') return 'success' as const
    if (setupState === 'connecting' || setupState === 'idle')
      return 'info' as const
    if (setupState === 'needs_auth') return 'warning' as const
    return 'error' as const
  }, [setupState])

  const flowSteps = useMemo(
    () =>
      [
        {
          title: 'Order Placed',
          description: isCashAppOrder
            ? 'Your order has been placed by the system.'
            : 'Order is not using Cash App and cannot use this flow.',
          state: !order
            ? ('active' as StepState)
            : isCashAppOrder
              ? ('complete' as StepState)
              : ('error' as StepState),
        },

        {
          title: isPaymentConfirmed ? 'Payment Confirmed' : 'Pending Payment',
          description:
            isPaymentConfirmed
              ? 'Payment confirmed and your order is now processing.'
              : setupState === 'ready'
              ? `Connected with ${assignedRep?.name ?? assignedRep?.email?.split('@')[0] ?? 'your rep'}.`
              : setupState === 'no_rep'
                ? 'No active representative could be connected.'
                : 'Selecting the next available representative.',
          state:
            isPaymentConfirmed
              ? ('complete' as StepState)
              : setupState === 'ready'
              ? ('complete' as StepState)
              : setupState === 'no_rep'
                ? ('error' as StepState)
                : ('active' as StepState),
        },
        // {
        //   title: 'Chat Pre-Seed',
        //   description: hasStarterMessage
        //     ? 'Order details were pre-sent so your rep has context immediately.'
        //     : 'Preparing your conversation starter with order details.',
        //   state:
        //     setupState !== 'ready'
        //       ? ('pending' as StepState)
        //       : hasStarterMessage
        //         ? ('complete' as StepState)
        //         : ('active' as StepState),
        // },
        // {
        //   title: 'Live Chat Action',
        //   description:
        //     setupState === 'ready'
        //       ? 'Open chat and confirm your Cash App handle + payment timing.'
        //       : 'Chat opens once representative assignment is ready.',
        //   state:
        //     setupState === 'ready'
        //       ? ('active' as StepState)
        //       : setupState === 'no_rep'
        //         ? ('pending' as StepState)
        //         : ('pending' as StepState),
        // },
      ] as Array<{title: string; description: string; state: StepState}>,
    [
      assignedRep?.email,
      assignedRep?.name,
      isCashAppOrder,
      isPaymentConfirmed,
      order,
      // hasStarterMessage,
      setupState,
    ],
  )

  const paymentStatus =
    isPaymentConfirmed
      ? 'Payment Confirmed'
      : setupState === 'ready'
      ? 'Rep Connected'
      : setupState === 'connecting'
        ? 'Pending Payment'
        : 'Pending Payment'

  const paymentStatusStyle =
    isPaymentConfirmed || setupState === 'ready'
      ? 'font-brk text-emerald-300 tracking-wide uppercase text-xs bg-emerald-500/10 border border-emerald-400/30 py-1 px-1.5 rounded-sm'
      : 'font-brk text-foreground tracking-wide uppercase text-xs bg-orange-500/10 border border-orange-400/30 py-1 px-1.5 rounded-sm'

  const orderHref = order ? `/account/orders/${order.orderNumber}` : '#'
  const repName =
    assignedRep?.name ?? assignedRep?.email?.split('@')[0] ?? 'Representative'

  const orderTotalLabel = order ? `$${formatPrice(order.totalCents)}` : '--'
  const itemCountLabel = order ? `${order.items.length}` : '--'

  const handleRetry = () => {
    setChatConnection({
      orderId,
      repFid: null,
      isConnecting: false,
      error: null,
    })
  }

  return (
    <main className='min-h-[calc(100lvh)] pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8 bg-black'>
      <ArcCard className='relative overflow-hidden'>
        <ArcHeader
          title={
            <div className='flex items-center space-x-2'>
              <Icon name='cashapp' className='text-cashapp size-6' />
              <span>Cash App Checkout</span>
            </div>
          }
          description={`Order*: ${order?.orderNumber.substring(5)}`}
          iconStyle='text-emerald-300'
          status={<span className={paymentStatusStyle}>{paymentStatus}</span>}
        />

        {/*<ArcCallout icon='info' value={chatMessage} type={chatCalloutType} />*/}

        <div className='rounded-xl border border-foreground/15 dark:bg-black/35 p-4 space-y-4'>
          <div className='hidden _flex items-center justify-between gap-3'>
            <div>
              <p className='text-sm font-polysans tracking-tight'>
                Live Handoff Panel
              </p>
              <p className='text-xs opacity-70'>
                Guided flow to move this payment into a representative chat
                session.
              </p>
            </div>
            <Chip
              size='sm'
              variant='flat'
              className='bg-foreground/10 text-foreground/80 border border-foreground/20'>
              {order?.payment.method?.split('_').join(' ') ?? 'cash app'}
            </Chip>
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-lg border border-foreground/15 bg-foreground/5 p-3'>
              <p className='text-[11px] uppercase tracking-wide opacity-70'>
                Order Total
              </p>
              <p className='text-lg font-okxs leading-6'>{orderTotalLabel}</p>
            </div>
            <div className='rounded-lg border border-foreground/15 bg-foreground/5 p-3'>
              <p className='text-[11px] uppercase tracking-wide opacity-70'>
                Items
              </p>
              <p className='text-lg font-okxs leading-6'>{itemCountLabel}</p>
            </div>
          </div>
        </div>

        <div className='rounded-xl border border-foreground/15 dark:bg-black/30 p-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <p className='text-sm font-okxs tracking-tight'>Checkout Status</p>
            {setupState === 'ready' ? (
              <Chip
                size='sm'
                variant='flat'
                className='bg-emerald-500/10 text-emerald-300 border border-emerald-400/30'>
                {repName}
              </Chip>
            ) : null}
          </div>
          <div className='space-y-3'>
            {flowSteps.map((step) => (
              <StepRow
                key={step.title}
                title={step.title}
                description={step.description}
                state={step.state}
              />
            ))}
          </div>
        </div>

        <div className='rounded-xl border border-foreground/15 dark:bg-black/35 p-4 space-y-3'>
          <p className='text-sm font-okxs tracking-tight'>Checkout Guide</p>
          <p className='text-xs opacity-75'>
            Our representatives will guide you through the payment process.
          </p>
          <Divider className='bg-foreground/15' />
          <div className='grid gap-2 text-xs'>
            <div className='flex items-start gap-2'>
              <Icon name='check-fill' className='size-4 text-emerald-300' />
              <span>
                Confirm your Cash App username with our representatives.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <Icon name='check-fill' className='size-4 text-emerald-300' />
              <span>
                Share any delivery notes or timing constraints for this order.
              </span>
            </div>
            <div className='flex items-start gap-2'>
              <Icon name='info' className='size-4 text-emerald-300' />
              <span>8% fee is will be added to your total order amount.</span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <Button
            as={NextLink}
            href={orderHref}
            size='lg'
            variant='flat'
            className='font-polysans font-normal dark:bg-sidebar'
            startContent={<Icon name='chevron-left' className='size-5' />}>
            Back To Order
          </Button>
          {setupState === 'no_rep' ? (
            <Button
              size='lg'
              color='primary'
              className='font-polysans font-medium bg-dark-gray dark:bg-white dark:text-dark-gray'
              onPress={handleRetry}
              endContent={<Icon name='spinners-ring' className='size-5' />}>
              Retry Rep Assignment
            </Button>
          ) : (
            <Button
              size='lg'
              color='primary'
              className='font-polysans font-medium bg-dark-gray dark:bg-white dark:text-dark-gray'
              onPress={toggleChatDockWindow}
              endContent={<Icon name='chat' className='size-5' />}>
              {setupState === 'ready' ? 'Open Live Chat' : 'Open Chat'}
            </Button>
          )}
        </div>
      </ArcCard>
    </main>
  )
}
