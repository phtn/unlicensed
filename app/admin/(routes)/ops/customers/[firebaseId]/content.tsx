'use client'

import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useAuthCtx} from '@/ctx/auth'
import {onError, onSuccess} from '@/ctx/toast'
import {
  isBundleCartItemWithProducts,
  isProductCartItemWithProduct,
} from '@/hooks/use-cart'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Image,
  Textarea,
  Tooltip,
} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {mapNumericFractions} from '../../../inventory/product/product-schema'

interface ContentProps {
  firebaseId: string
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const Content = ({firebaseId}: ContentProps) => {
  const router = useRouter()
  const {user} = useAuthCtx()
  const [isOpeningChat, setIsOpeningChat] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [isSavingRemarks, setIsSavingRemarks] = useState(false)
  const followForChat = useMutation(api.follows.m.follow)
  const updateCustomerNotes = useMutation(api.users.m.updateNotes)
  const customer = useQuery(api.users.q.getByFid, {fid: firebaseId})
  const customerAddresses = useQuery(api.users.q.getUserAddresses, {
    fid: firebaseId,
  })
  const conversations = useQuery(
    api.messages.q.getConversations,
    user?.uid ? {fid: user.uid} : 'skip',
  )
  const orders = useQuery(
    api.orders.q.getUserOrders,
    customer?._id ? {userId: customer._id, limit: 15} : 'skip',
  )
  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    customer?._id ? {userId: customer._id} : 'skip',
  )
  const cart = useQuery(
    api.cart.q.getCart,
    customer?._id ? {userId: customer._id} : 'skip',
  )
  const customerId = customer?._id
  const customerNotes = customer?.notes ?? ''
  const storeCreditLabel =
    pointsBalance === undefined
      ? 'Loading rewards...'
      : `$${formatPrice(Math.round((pointsBalance.availablePoints ?? 0) * 100))}`
  const productImageIds = useMemo(
    () =>
      (cart?.items ?? []).flatMap((item) => {
        if (isProductCartItemWithProduct(item) && item.product?.image)
          return [item.product.image]
        if (isBundleCartItemWithProducts(item))
          return item.bundleItemsWithProducts
            .map((bi) => bi.product?.image)
            .filter((id): id is Id<'_storage'> => !!id)
        return []
      }),
    [cart?.items],
  )
  const resolveUrl = useStorageUrls(productImageIds)
  const customerChatFid = customer?.fid ?? customer?.firebaseId ?? null
  const hasExistingConversation = useMemo(() => {
    if (!customerChatFid || !conversations) return false
    return conversations.some((conversation) => {
      const otherFid = conversation?.otherUser?.fid
      return otherFid != null && otherFid === customerChatFid
    })
  }, [conversations, customerChatFid])

  useEffect(() => {
    if (!customerId) return
    setRemarks(customerNotes)
  }, [customerId, customerNotes])

  const handleOpenChat = useCallback(async () => {
    if (!user?.uid) {
      onError('You must be signed in to start a chat')
      return
    }
    if (!customer || !customerChatFid) {
      onError('Customer does not have a chat profile ID')
      return
    }
    setIsOpeningChat(true)
    try {
      if (!hasExistingConversation) {
        await followForChat({
          followedId: customer._id,
          followerId: user.uid,
        })
        onSuccess('Chat room created')
      }
      router.push(`/account/chat/${customerChatFid}`)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to open chat')
    } finally {
      setIsOpeningChat(false)
    }
  }, [
    customer,
    customerChatFid,
    followForChat,
    hasExistingConversation,
    router,
    user?.uid,
  ])

  const handleSaveRemarks = useCallback(async () => {
    if (!customerId) return
    if (remarks === customerNotes) return

    setIsSavingRemarks(true)
    try {
      await updateCustomerNotes({
        userId: customerId,
        notes: remarks,
      })
      onSuccess('Customer notes updated')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update notes')
    } finally {
      setIsSavingRemarks(false)
    }
  }, [customerId, customerNotes, remarks, updateCustomerNotes])

  const handleRemarksBlur = useCallback(() => {
    void handleSaveRemarks()
  }, [handleSaveRemarks])

  if (customer === undefined) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-4'>
          <p className='text-sm text-gray-400'>Loading customer profile...</p>
        </Card>
      </main>
    )
  }

  if (customer === null) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card shadow='sm' className='p-6'>
          <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>Customer Not Found</h1>
            <p className='text-sm text-gray-400'>
              No customer exists for ID: {firebaseId}
            </p>
            <Button
              prefetch
              as={Link}
              variant='flat'
              color='primary'
              href={'/admin/ops/customers'}>
              Back to Customers
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-2 mt-4'>
        <div className='flex items-center gap-4'>
          <Button
            prefetch
            as={Link}
            radius='none'
            isIconOnly
            variant='faded'
            className='min-w-0 border-none rounded-lg'
            aria-label='Back to customers'
            href={'/admin/ops/customers'}>
            <Icon name='chevron-left' className='size-4' />
          </Button>
          <div className='flex-1'>
            <div className='flex items-center space-x-4 md:space-x-6'>
              <Avatar
                src={customer.photoUrl}
                size='lg'
                classNames={{
                  base: 'bg-linear-to-br from-[#FFB457] to-[#FF705B]',
                  icon: 'text-black/80',
                }}
                icon={<Icon name='user-fill' className='size-5' />}
              />
              <div className='flex-1 space-y-1'>
                <h1 className='text-xl font-semibold space-x-3'>
                  <span className='opacity-80'>
                    {customer.email?.split('@').shift()}
                  </span>
                  <span className='font-okxs font-light text-foreground opacity-60'>
                    {customer.name}
                  </span>
                  <Chip
                    size='sm'
                    variant='faded'
                    className='capitalize border-none bg-dark-table text-white'>
                    {(customer.accountStatus ?? 'active').replace(/_/g, ' ')}
                  </Chip>
                </h1>
                <div className='flex items-center space-x-6'>
                  {customer.contact?.phone && (
                    <div className='flex items-center space-x-1'>
                      <Icon name='phone' className='size-3.5 opacity-80' />
                      <p className='text-sm'>{customer.contact?.phone}</p>
                    </div>
                  )}

                  <div className='flex items-center space-x-1'>
                    <Icon
                      name='mail-send-fill'
                      className='size-3.5 opacity-80'
                    />
                    <p className='text-sm'>{customer.email}</p>
                  </div>
                  <Button
                    radius='none'
                    variant='solid'
                    size='sm'
                    isLoading={isOpeningChat}
                    isDisabled={isOpeningChat || !customerChatFid}
                    onPress={handleOpenChat}
                    className='flex items-center bg-transparent border-none text-sm space-x-1 hover:bg-sidebar rounded-md'
                    endContent={
                      <Icon
                        name='chat'
                        className='size-3.5 cursor-pointer opacity-80'
                      />
                    }>
                    <span className='-mr-1'>chat</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='h-2 bg-sidebar' />
        <div className='grid md:grid-cols-2 gap-x-2'>
          <div className='space-y-4 py-4'>
            <Card shadow='none' className='px-2 space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-xs font-brk uppercase tracking-wide text-muted-foreground'>
                    FID
                  </p>
                  <p className='font-mono text-xs'>
                    {customer.firebaseId ?? 'N/A'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs font-brk uppercase tracking-wide text-muted-foreground'>
                    UID
                  </p>
                  <p className='font-mono text-xs'>{customer._id ?? 'N/A'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs font-brk uppercase tracking-wide text-muted-foreground'>
                    Joined
                  </p>
                  <p className='text-sm'>{formatDate(customer.createdAt)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-xs font-brk uppercase tracking-wide text-muted-foreground'>
                    Rewards Points
                  </p>
                  <p id='store-credit' className='text-sm'>
                    {storeCreditLabel}
                  </p>
                </div>
              </div>
            </Card>

            <Card shadow='none' className='py-6 px-2'>
              <h2 className='text-base font-semibold'>Addresses</h2>
              {customerAddresses === undefined ? (
                <p className='text-sm text-muted-foreground'>
                  Loading addresses...
                </p>
              ) : customerAddresses.length ? (
                <div className='space-y-3'>
                  {customerAddresses.map((address) => (
                    <div
                      key={address.id}
                      className='rounded-lg border border-divider p-3 text-sm'>
                      <p className='font-medium'>
                        {address.firstName} {address.lastName}
                      </p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No addresses on file.
                </p>
              )}
            </Card>
            <Card shadow='none' className='py-4 px-2'>
              <h2 className='text-base font-semibold'>Shipping Accounts</h2>
              <p className='text-sm text-muted-foreground'>
                No Shipping accounts link to customer&apos;s orders on file.
              </p>
            </Card>
            {/* Remarks */}
            <div className='py-4 px-2'>
              <label className='text-base font-semibold mb-2 block'>
                Internal Remarks
              </label>
              <Textarea
                value={remarks}
                onValueChange={setRemarks}
                onBlur={handleRemarksBlur}
                placeholder='Add internal notes or remarks...'
                minRows={3}
                maxRows={6}
                isDisabled={isSavingRemarks}
              />
              <div className='mt-2 flex justify-end'>
                <Button
                  size='sm'
                  variant='flat'
                  onPress={() => void handleSaveRemarks()}
                  isLoading={isSavingRemarks}
                  isDisabled={isSavingRemarks || remarks === customerNotes}>
                  Save notes
                </Button>
              </div>
            </div>
            <div id='in-cart-items' className='py-4 px-2'>
              <h2 className='text-base font-semibold'>In-Cart</h2>
              {cart === undefined ? (
                <p className='text-sm text-muted-foreground'>Loading cart...</p>
              ) : !cart?.items?.length ? (
                <p className='text-sm text-muted-foreground'>Cart is empty.</p>
              ) : (
                <div className='grid grid-cols-9 gap-1'>
                  {cart.items.map((item, i) => {
                    if (isProductCartItemWithProduct(item)) {
                      const p = item.product
                      const imageUrl = p?.image
                        ? (resolveUrl(p.image) ?? undefined)
                        : undefined
                      const hasImage = Boolean(p?.image && imageUrl)
                      return (
                        <Tooltip
                          key={item.productId}
                          content={
                            <div className='flex items-center space-x-1'>
                              <span>{p?.name}</span>
                              <span>
                                {item.denomination &&
                                  mapNumericFractions[item.denomination]}{' '}
                                {p?.unit}
                              </span>
                              <span>x {item?.quantity}</span>
                            </div>
                          }>
                          <div
                            key={`${item.productId}-${item.denomination ?? 'd'}-${i}`}
                            className='aspect-square flex flex-col overflow-hidden rounded-lg border border-divider'>
                            <div className='relative flex-1 min-h-0 bg-muted'>
                              {hasImage ? (
                                <Image
                                  radius='none'
                                  src={imageUrl ?? ''}
                                  alt={p?.name ?? 'Product'}
                                  className='size-full object-cover'
                                />
                              ) : (
                                <div className='size-full flex items-center justify-center'>
                                  <Icon
                                    name='bag-solid'
                                    className='size-6 text-muted-foreground'
                                  />
                                </div>
                              )}
                            </div>
                            <div className='flex items-center justify-between gap-1 p-1 text-xs'>
                              <span className='truncate font-medium'>
                                {p?.name ?? 'Product'}
                              </span>
                              <div className='flex size-5 shrink-0 items-center justify-center rounded-full bg-alum text-[10px]'>
                                {item.quantity}
                              </div>
                            </div>
                          </div>
                        </Tooltip>
                      )
                    }
                    if (isBundleCartItemWithProducts(item)) {
                      const label =
                        item.bundleType?.replace(/_/g, ' ') ?? 'Bundle'
                      return (
                        <div
                          key={`bundle-${i}`}
                          className='flex items-center justify-between rounded-lg border border-divider p-2 text-sm'>
                          <span className='font-medium truncate'>{label}</span>
                          <span className='text-muted-foreground shrink-0'>
                            ×1
                          </span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          </div>
          <div className='px-4 border-l border-sidebar'>
            <Card
              shadow='none'
              radius='none'
              className='py-2 space-y-4 max-h-[calc(82lvh)] overflow-scroll'>
              <h2 className='text-base font-semibold'>Recent Orders</h2>
              {orders === undefined ? (
                <p className='text-sm text-muted-foreground'>
                  Loading orders...
                </p>
              ) : orders.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No orders yet.</p>
              ) : (
                <div className='space-y-2'>
                  {orders.map((order, i) => (
                    <div
                      key={order._id}
                      className='flex items-center justify-between rounded-lg border border-divider p-3'>
                      <div className='flex space-x-3'>
                        <div className='font-brk opacity-70'>{i + 1}</div>
                        <div>
                          <Link
                            prefetch
                            href={`/admin/ops/orders/${order.orderNumber}`}
                            className='font-medium hover:underline underline-offset-2'>
                            {order.orderNumber}
                          </Link>
                          <p className='text-xs text-muted-foreground'>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className='text-right'>
                        <p className='text-sm font-semibold'>
                          ${formatPrice(order.totalCents)}
                        </p>
                        <p className='text-xs capitalize text-muted-foreground'>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
