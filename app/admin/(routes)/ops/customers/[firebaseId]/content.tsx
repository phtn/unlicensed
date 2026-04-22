'use client'

import {HeroAvatarImage} from '@/components/ui/heroui-avatar-image'
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
import {Avatar, Button, Card, Chip, Input, TextArea} from '@heroui/react'
import {useMutation, useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {mapNumericFractions} from '../../../inventory/product/product-schema'

import {LegacyImage} from '@/components/ui/legacy-image'
import {getInitials} from '@/utils/initials'

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
  const [rewardPointsInput, setRewardPointsInput] = useState('')
  const [isSavingRewardPoints, setIsSavingRewardPoints] = useState(false)
  const [isSavingWholesale, setIsSavingWholesale] = useState(false)
  const followForChat = useMutation(api.follows.m.follow)
  const updateCustomerNotes = useMutation(api.users.m.updateNotes)
  const setUserAvailablePoints = useMutation(
    api.rewards.m.setUserAvailablePoints,
  )
  const setWholesale = useMutation(api.users.m.setWholesale)
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
  const customerEmail =
    customer?.contact?.alternateEmail?.trim() || customer?.email || ''
  const customerNotes = customer?.notes ?? ''
  const currentAvailablePoints = pointsBalance?.availablePoints ?? 0
  const storeCreditLabel =
    pointsBalance === undefined
      ? 'Loading rewards...'
      : `$${formatPrice(Math.round(currentAvailablePoints * 100))}`
  const editorUsername =
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    user?.email ||
    'Unknown admin'
  const parsedRewardPointsInput =
    rewardPointsInput.trim() === ''
      ? Number.NaN
      : Number.parseFloat(rewardPointsInput)
  const normalizedRewardPointsInput = Number.isFinite(parsedRewardPointsInput)
    ? Math.round(parsedRewardPointsInput * 100) / 100
    : Number.NaN
  const isRewardPointsDirty =
    Number.isFinite(normalizedRewardPointsInput) &&
    normalizedRewardPointsInput >= 0 &&
    Math.abs(normalizedRewardPointsInput - currentAvailablePoints) > 0.0001
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

  useEffect(() => {
    if (pointsBalance === undefined) return
    setRewardPointsInput(currentAvailablePoints.toFixed(2))
  }, [currentAvailablePoints, pointsBalance])

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

  const handleSaveRewardPoints = useCallback(async () => {
    if (!customerId) return
    if (
      !Number.isFinite(normalizedRewardPointsInput) ||
      normalizedRewardPointsInput < 0
    ) {
      onError('Rewards points must be a non-negative number')
      return
    }
    if (!isRewardPointsDirty) return

    setIsSavingRewardPoints(true)
    try {
      await setUserAvailablePoints({
        userId: customerId,
        points: normalizedRewardPointsInput,
        editedBy: editorUsername,
      })
      onSuccess('Rewards points updated')
    } catch (err) {
      onError(
        err instanceof Error ? err.message : 'Failed to update rewards points',
      )
    } finally {
      setIsSavingRewardPoints(false)
    }
  }, [
    customerId,
    editorUsername,
    isRewardPointsDirty,
    normalizedRewardPointsInput,
    setUserAvailablePoints,
  ])

  const handleToggleWholesale = useCallback(
    async (next: boolean) => {
      if (!customerId) return
      setIsSavingWholesale(true)
      try {
        await setWholesale({userId: customerId, wholesale: next})

        // Sync the bulk claim to Firebase
        const fid = customer?.fid ?? customer?.firebaseId
        if (fid) {
          const idToken = await user?.getIdToken()
          await fetch(`/api/admin/users/${fid}/claims`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({claims: {bulk: next || null}}),
          })
        }

        onSuccess(next ? 'Bulk pricing enabled' : 'Bulk pricing disabled')
      } catch {
        onError('Failed to update wholesale status')
      } finally {
        setIsSavingWholesale(false)
      }
    },
    [customerId, customer, user, setWholesale],
  )

  if (customer === undefined) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card className='p-4'>
          <p className='text-sm text-gray-400'>Loading customer profile...</p>
        </Card>
      </main>
    )
  }

  if (customer === null) {
    return (
      <main className='min-h-screen px-4 pb-16'>
        <Card className='p-6'>
          <div className='space-y-4'>
            <h1 className='text-xl font-semibold'>Customer Not Found</h1>
            <p className='text-sm text-gray-400'>
              No customer exists for ID: {firebaseId}
            </p>
            <Link prefetch href={'/admin/ops/customers'}>
              Back to Customers
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className='min-h-screen px-4 pb-16'>
      <div className='space-y-2 mt-4'>
        <div className='flex items-start gap-3 sm:items-center sm:gap-4'>
          <Link
            prefetch
            className='min-w-0 border-none rounded-lg'
            aria-label='Back to customers'
            href={'/admin/ops/customers'}
          >
            <Icon name='chevron-left' className='size-4' />
          </Link>
          <div className='min-w-0 flex-1'>
            <div className='flex min-w-0 items-start gap-3 md:items-center md:gap-6'>
              <Avatar className='size-9 shrink-0 border border-foreground/10 bg-background text-foreground shadow-sm dark:border-white/10 dark:bg-dark-table'>
                <HeroAvatarImage
                  alt={customer.photoUrl ?? 'photo'}
                  src={customer.photoUrl}
                />
                <Avatar.Fallback>{getInitials(customerEmail)}</Avatar.Fallback>
              </Avatar>
              <div className='min-w-0 flex-1 space-y-1'>
                <h1 className='flex min-w-0 flex-wrap items-center gap-2 text-xl font-semibold'>
                  <span className='min-w-0 break-all opacity-80'>
                    {customerEmail.split('@').shift()}
                  </span>
                  <span className='min-w-0 break-words font-okxs font-light text-foreground opacity-60'>
                    {customer.name}
                  </span>
                  <Chip
                    size='sm'
                    variant='secondary'
                    className='capitalize border-none bg-dark-table text-white'
                  >
                    {(customer.accountStatus ?? 'active').replace(/_/g, ' ')}
                  </Chip>
                </h1>
                <div className='flex min-w-0 flex-wrap items-center gap-3 md:gap-6'>
                  {customer.contact?.phone && (
                    <div className='flex items-center gap-1'>
                      <Icon name='phone' className='size-3.5 opacity-80' />
                      <p className='text-sm'>{customer.contact?.phone}</p>
                    </div>
                  )}

                  <div className='flex min-w-0 items-center gap-1'>
                    <Icon
                      name='mail-send-fill'
                      className='size-3.5 shrink-0 opacity-80'
                    />
                    <p className='min-w-0 break-all text-sm'>{customerEmail}</p>
                  </div>
                  <Button
                    size='sm'
                    variant='primary'
                    isDisabled={isOpeningChat || !customerChatFid}
                    onPress={handleOpenChat}
                    className='flex items-center bg-transparent border-none text-sm space-x-1 hover:bg-sidebar rounded-md'
                  >
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
            <Card className='px-2 space-y-4'>
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
                  <div className='space-y-2'>
                    <p id='store-credit' className='text-sm'>
                      {storeCreditLabel}
                    </p>
                  </div>
                </div>
                <div className='w-full md:col-span-2'>
                  <label
                    htmlFor='reward-points'
                    className='text-xs font-brk uppercase tracking-wide text-muted-foreground'
                  >
                    <span className='mr-2'>Edit rewards balance</span>
                  </label>
                  <div className='flex w-full flex-col items-stretch gap-3 bg-sidebar/40 p-2 sm:flex-row sm:items-center sm:gap-4'>
                    <Input
                      id='reward-points'
                      type='number'
                      min='0'
                      step='0.01'
                      value={rewardPointsInput}
                      onChange={(e) => setRewardPointsInput(e.target.value)}
                      disabled={
                        isSavingRewardPoints || pointsBalance === undefined
                      }
                      className='w-full sm:max-w-48'
                      placeholder='0.00'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void handleSaveRewardPoints()
                        }
                      }}
                    />
                    <Button
                      size='sm'
                      variant='tertiary'
                      className='rounded-sm sm:w-auto'
                      isDisabled={
                        isSavingRewardPoints ||
                        pointsBalance === undefined ||
                        !isRewardPointsDirty ||
                        !Number.isFinite(normalizedRewardPointsInput) ||
                        normalizedRewardPointsInput < 0
                      }
                      onPress={() => void handleSaveRewardPoints()}
                    >
                      Save Changes
                    </Button>
                  </div>
                  {pointsBalance?.lastPointsEditedBy && (
                    <p className='text-xs text-muted-foreground'>
                      Last edited by{' '}
                      <span className='font-semibold text-foreground/80'>
                        {pointsBalance.lastPointsEditedBy}
                      </span>
                      {pointsBalance.lastPointsEditedAt
                        ? ` on ${formatDate(pointsBalance.lastPointsEditedAt)}`
                        : ''}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className='px-2 py-4'>
              <div className='flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center'>
                <div className='space-y-0.5'>
                  <p className='text-xs font-brk uppercase tracking-wide text-muted-foreground'>
                    Bulk / Wholesale
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {customer.wholesale
                      ? 'Wholesale pricing active'
                      : 'Standard pricing'}
                  </p>
                </div>
                <Button
                  size='sm'
                  variant={customer.wholesale ? 'secondary' : 'primary'}
                  className='shrink-0 rounded-sm'
                  isDisabled={isSavingWholesale}
                  onPress={() =>
                    void handleToggleWholesale(!customer.wholesale)
                  }
                >
                  {isSavingWholesale
                    ? 'Saving…'
                    : customer.wholesale
                      ? 'Revoke Bulk'
                      : 'Grant Bulk'}
                </Button>
              </div>
            </Card>

            <Card className='py-6 px-2'>
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
                      className='rounded-lg border border-divider p-3 text-sm'
                    >
                      <p className='font-medium'>
                        {address.firstName} {address.lastName}
                      </p>
                      <p>{address.addressLine1}</p>
                      {address.addressLine2 && <p>{address.addressLine2}</p>}
                      <p>
                        {address.city}, {address.state} {address.zipCode},{' '}
                        {address.country}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  No addresses on file.
                </p>
              )}
            </Card>
            <Card className='py-4 px-2'>
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
              <TextArea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                onBlur={handleRemarksBlur}
                placeholder='Add internal notes or remarks...'
                rows={3}
                disabled={isSavingRemarks}
              />
              <div className='mt-2 flex justify-end'>
                <Button
                  size='sm'
                  variant='tertiary'
                  onPress={() => void handleSaveRemarks()}
                  isDisabled={isSavingRemarks || remarks === customerNotes}
                >
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
                <div className='grid grid-cols-2 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9'>
                  {cart.items.map((item, i) => {
                    if (isProductCartItemWithProduct(item)) {
                      const p = item.product
                      const imageUrl = p?.image
                        ? (resolveUrl(p.image) ?? undefined)
                        : undefined
                      const hasImage = Boolean(p?.image && imageUrl)
                      return (
                        <div
                          key={item.productId}
                          title={`${p?.name ?? 'Product'} ${item.denomination ? mapNumericFractions[item.denomination] : ''} ${p?.unit ?? ''} x ${item?.quantity}`}
                        >
                          <div
                            key={`${item.productId}-${item.denomination ?? 'd'}-${i}`}
                            className='aspect-square flex flex-col overflow-hidden rounded-lg border border-divider'
                          >
                            <div className='relative flex-1 min-h-0 bg-muted'>
                              {hasImage ? (
                                <LegacyImage
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
                        </div>
                      )
                    }
                    if (isBundleCartItemWithProducts(item)) {
                      const label =
                        item.bundleType?.replace(/_/g, ' ') ?? 'Bundle'
                      return (
                        <div
                          key={`bundle-${i}`}
                          className='flex items-center justify-between gap-2 rounded-lg border border-divider p-2 text-sm'
                        >
                          <span className='min-w-0 truncate font-medium'>
                            {label}
                          </span>
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
          <div className='px-0 md:border-l md:border-sidebar md:px-4'>
            <Card className='space-y-4 overflow-scroll py-2 md:max-h-[calc(82lvh)]'>
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
                      className='flex flex-col gap-3 rounded-lg border border-divider p-3 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div className='flex min-w-0 gap-3'>
                        <div className='font-brk opacity-70'>{i + 1}</div>
                        <div className='min-w-0'>
                          <Link
                            prefetch
                            href={`/admin/ops/orders/${order.orderNumber}`}
                            className='break-all font-medium underline-offset-2 hover:underline'
                          >
                            {order.orderNumber}
                          </Link>
                          <p className='text-xs text-muted-foreground'>
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className='text-left sm:text-right'>
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
