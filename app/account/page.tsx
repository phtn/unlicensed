'use client'
import {Callout, DotDiv} from '@/components/ui/callout'

import {Ascend} from '@/components/expermtl/ascend'
import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {formatPrice} from '@/utils/formatPrice'
import {
  Button,
  Card,
  CardBody,
  Chip,
  ChipProps,
  Image,
  Progress,
} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useTheme} from 'next-themes'
import Link from 'next/link'
import {memo, startTransition, useMemo, useState, ViewTransition} from 'react'

export default function AccountPage() {
  const {user: firebaseUser} = useAuth()
  const [showAllOrders, setShowAllOrders] = useState(false)

  // 1. Get Current User
  const convexUser = useQuery(
    api.users.q.getCurrentUser,
    firebaseUser ? {firebaseId: firebaseUser.uid} : 'skip',
  )

  // 2. Get Dependent Data (only if we have convexUser._id)
  const userId = convexUser?._id

  const orderStats = useQuery(
    api.orders.q.getUserOrderStats,
    userId ? {userId} : 'skip',
  )

  const userRewards = useQuery(
    api.rewards.q.getUserRewards,
    userId ? {userId} : 'skip',
  )

  const recentOrders = useQuery(
    api.orders.q.getUserOrders,
    userId ? {userId, limit: showAllOrders ? 20 : 5} : 'skip',
  )

  const tierBenefits = useQuery(
    api.rewards.q.getUserTierBenefits,
    userId ? {userId} : 'skip',
  )

  const pointsBalance = useQuery(
    api.rewards.q.getUserPointsBalance,
    userId ? {userId} : 'skip',
  )

  const nextVisitMultiplier = useQuery(
    api.rewards.q.getNextVisitMultiplier,
    userId ? {userId} : 'skip',
  )

  // Loading State (Initial page load only)
  const isLoading = !convexUser

  // Calculate Progress to Next Tier
  const nextTierProgress = useMemo(() => {
    if (!userRewards || !userRewards.nextTier) return 100
    const currentSpend = userRewards.lifetimeSpendingCents
    const nextTierSpend = userRewards.nextTier.minimumSpendingCents || 0
    if (nextTierSpend === 0) return 100
    return Math.min(100, (currentSpend / nextTierSpend) * 100)
  }, [userRewards])

  const spendToNextTier = useMemo(() => {
    if (!userRewards || !userRewards.nextTier) return 0
    const currentSpend = userRewards.lifetimeSpendingCents
    const nextTierSpend = userRewards.nextTier.minimumSpendingCents || 0
    return Math.max(0, nextTierSpend - currentSpend)
  }, [userRewards])

  // Helper for Order Status Color
  const getStatusColor = (status: string): ChipProps['color'] => {
    switch (status) {
      case 'pending_payment':
        return 'warning'
      case 'order_processing':
        return 'primary'
      case 'awaiting_courier_pickup':
        return 'secondary'
      case 'shipping':
        return 'default'
      case 'resend':
        return 'warning'
      case 'shipped':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'default'
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const toggleShowAllOrders = () => {
    startTransition(() => {
      setShowAllOrders((prev) => !prev)
    })
  }

  if (isLoading && firebaseUser && true) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-18 lg:py-28'>
        {/* Header Section */}
        <div className='mb-8'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <Callout
              title={
                <h1 className='md:text-xl font-normal font-polysans space-x-1 md:space-x-4'>
                  <span>Development in-progress</span>
                  <DotDiv />
                  <span>Redirect enabled</span>
                </h1>
              }
              description='Checkout route protected. Please check back later.'
              icon='code'
              type='debug'
            />
            {userRewards?.currentTier && (
              <Chip
                variant='shadow'
                classNames={{
                  base: 'bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 border-small border-white/50 shadow-lg shadow-pink-500/20',
                  content:
                    'drop-shadow shadow-black text-white font-semibold tracking-wider px-3',
                }}
                size='lg'
                startContent={
                  <Icon name='star-fill' className='size-4 text-white' />
                }>
                {userRewards.currentTier.name.toUpperCase()} MEMBER
              </Chip>
            )}
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column: Profile & Rewards (1/3 width) */}
          <div className='space-y-6 lg:col-span-1'>
            {/* Profile Card */}
            <Card
              shadow='none'
              radius='none'
              className='relative border border-foreground/20 rounded-4xl bg-black dark:bg-dark-table/40'>
              <ProfileBackground />
              <CardBody className='p-6'>
                <div className='flex flex-col items-center text-center space-y-5 justify-center'>
                  <div className=''>
                    <div className='size-32 mask-b-from-50% mask-radial-[50%_50%] mask-radial-from-80% rounded-full p-0.5 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500'>
                      <div className='z-200 w-full h-full rounded-full overflow-hidden border-4 border-background bg-background flex items-center justify-center'>
                        {convexUser?.photoUrl || firebaseUser?.photoURL ? (
                          <Image
                            src={
                              convexUser?.photoUrl ||
                              firebaseUser?.photoURL ||
                              ''
                            }
                            alt='Profile'
                            className='size-full object-cover relative z-100'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center font-polysans font-normal bg-linear-to-br from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 text-4xl text-white dark:text-indigo-400 '>
                            {(
                              convexUser?.name ||
                              firebaseUser?.displayName ||
                              ''
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {userRewards?.isVIP && (
                      <div className='absolute -bottom-1 -right-1 bg-linear-to-br from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-background'>
                        VIP
                      </div>
                    )}
                  </div>
                  <h2 className='text-xl font-bone tracking-tight text-white'>
                    {convexUser?.name ?? firebaseUser?.displayName}
                  </h2>
                  {/*<div className='space-y-1'>

                  </div>*/}

                  <div className='hidden w-full pt-4 border-t border-default-200/50'>
                    <div className='flex items-center justify-center gap-6'>
                      <div className='text-center'>
                        <p className='text-xs uppercase tracking-wider text-default-500 mb-1'>
                          Orders
                        </p>
                        <p className='text-2xl font-bold'>
                          {orderStats?.totalOrders ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Points Balance Card */}
            {pointsBalance && (
              <Card
                shadow='none'
                className='border border-foreground/20 bg-linear-to-br from-teal-500/10 via-orange-100/10 to-orange-200/10 backdrop-blur-sm dark:bg-dark-table/20'>
                <CardBody className='p-6 space-y-5'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-semibold font-polysans text-2xl tracking-tight'>
                      Rewards
                    </h3>
                    <div className=''>
                      <Icon
                        name='coins'
                        className='size-20 dark:text-purple-100'
                      />
                    </div>
                  </div>

                  <div className='space-y-4'>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-4xl font-medium font-space bg-linear-to-br from-black to-orange-200 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent'>
                        {pointsBalance.availablePoints.toLocaleString()}
                      </span>
                      <span className='text-base font-medium'>pts</span>
                    </div>
                    {nextVisitMultiplier && (
                      <div className='pt-3 border-t border-default-200/50 space-y-2'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-default-600 dark:text-default-400 font-medium'>
                            Next Visit Multiplier
                          </span>
                          <div className='dark:text-teal-300 font-semibold font-bone text-2xl'>
                            <span className='text-base'>x</span>
                            {nextVisitMultiplier.multiplier}
                          </div>
                        </div>
                        {/*<p className='text-xs text-default-500 leading-relaxed'>
                          {nextVisitMultiplier.message}
                        </p>*/}
                      </div>
                    )}
                    <div className='text-xs text-default-500 pt-2'>
                      Lifetime:{' '}
                      <span className='font-semibold text-default-700 dark:text-default-300'>
                        {pointsBalance.totalPoints.toLocaleString()} points
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Loyalty Progress Card */}
            {userRewards?.nextTier && (
              <Card
                shadow='none'
                className='border border-foreground/20 backdrop-blur-sm'>
                <CardBody className='p-6 space-y-5'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2.5'>
                      <div className='p-2 rounded-xl bg-primary/20'>
                        <Icon
                          name='star-fill'
                          className='size-5 text-primary'
                        />
                      </div>
                      <h3 className='font-semibold font-nito text-base tracking-tight'>
                        Next Reward Tier
                      </h3>
                    </div>
                    <Chip
                      size='sm'
                      variant='flat'
                      className='bg-primary/20 text-primary font-nito font-semibold'>
                      {userRewards.nextTier.name}
                    </Chip>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex justify-between items-center text-sm'>
                      <span className='text-default-600 dark:text-default-400 font-medium'>
                        Progress
                      </span>
                      <span className='font-bold text-primary'>
                        {Math.round(nextTierProgress)}%
                      </span>
                    </div>
                    <Progress
                      value={nextTierProgress}
                      color='secondary'
                      className='h-2.5'
                      classNames={{
                        indicator:
                          'bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500',
                      }}
                    />
                    <p className='text-xs text-default-500 text-center leading-relaxed pt-1'>
                      Spend{' '}
                      <span className='font-bold text-foreground'>
                        ${formatPrice(spendToNextTier)}
                      </span>{' '}
                      more to reach{' '}
                      <span className='font-semibold text-primary'>
                        {userRewards.nextTier.name}
                      </span>{' '}
                      status
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Benefits Summary */}
            <Card
              shadow='none'
              radius='none'
              className='hidden rounded-3xl border border-foreground/20 bg-content1/50 backdrop-blur-sm'>
              <CardBody className='p-0'>
                <div className='px-6 py-4'>
                  <h3 className='font-semibold font-nito text-base tracking-tight'>
                    Member Benefits
                  </h3>
                </div>
                <div className='p-4 space-y-2'>
                  {tierBenefits?.discountPercentage ? (
                    <div className='flex items-center gap-3 p-4 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 transition-all hover:bg-green-50 dark:hover:bg-green-900/20'>
                      <div className='p-2.5 rounded-xl bg-green-500/20 text-green-600 dark:text-green-400'>
                        <Icon name='percent' className='size-4.5' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-green-700 dark:text-green-400'>
                          {tierBenefits.discountPercentage}% OFF
                        </p>
                        <p className='text-xs text-default-500 mt-0.5'>
                          On all orders
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tierBenefits?.freeShipping && (
                    <div className='flex items-center gap-3 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                      <div className='p-2.5 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400'>
                        <Icon name='truck' className='size-4.5' />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-blue-700 dark:text-blue-400'>
                          Free Shipping
                        </p>
                        <p className='text-xs text-default-500 mt-0.5'>
                          On all eligible orders
                        </p>
                      </div>
                    </div>
                  )}
                  <Callout
                    title='Member Access'
                    description='Benefits and perks.'
                    icon='user'
                  />
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Orders (2/3 width) */}
          <div className='lg:col-span-2'>
            {/* Recent Orders Section */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <div>
                  <p className='text-sm text-default-500 px-2'>Active Orders</p>
                </div>
                {recentOrders && recentOrders.length > 5 && (
                  <Button
                    variant='light'
                    onPress={toggleShowAllOrders}
                    endContent={
                      showAllOrders ? (
                        <Icon name='arrow-up' className='size-4' />
                      ) : (
                        <Icon name='chevron-right' className='size-4' />
                      )
                    }
                    className='text-default-600 dark:text-default-400 hover:text-foreground font-medium'>
                    {showAllOrders ? 'Show Less' : 'View All'}
                  </Button>
                )}
              </div>

              <ViewTransition>
                <div className='space-y-3 min-h-25'>
                  {recentOrders === undefined ? (
                    <div className='w-full flex justify-center items-center py-16'>
                      <Loader />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <Card className='border-2 border-dashed border-default-200 dark:border-default-100/20 bg-default-50/50 dark:bg-default-50/5'>
                      <CardBody className='py-16 flex flex-col items-center justify-center text-center'>
                        <div className='w-20 h-20 rounded-full bg-default-100 dark:bg-default-50/10 flex items-center justify-center mb-5'>
                          <Icon
                            name='package-car'
                            className='size-9 text-default-400'
                          />
                        </div>
                        <h3 className='text-xl font-semibold text-foreground mb-2'>
                          No orders yet
                        </h3>
                        <p className='text-default-500 max-w-sm mb-6 leading-relaxed'>
                          Start shopping to see your orders and earn rewards!
                        </p>
                        <Button
                          as={Link}
                          href='/products'
                          color='primary'
                          size='lg'
                          className='font-semibold'>
                          Browse Products
                        </Button>
                      </CardBody>
                    </Card>
                  ) : (
                    recentOrders.map((order) => (
                      <Card
                        shadow='none'
                        key={order._id}
                        as={Link}
                        href={`/account/orders/${order._id}`}
                        isPressable
                        className='w-full border hover:border-foreground/20 bg-content/50 backdrop-blur-sm hover:shadow-xs transition-all duration-200 hover:-translate-y-0.5'>
                        <CardBody className='p-5'>
                          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <div className='flex items-start gap-4 flex-1 min-w-0'>
                              <div className='p-3 rounded-xl bg-linear-to-br from-default-100/30 to-default-500/10 hidden sm:flex shrink-0'>
                                <Icon
                                  name='box'
                                  className='size-5 opacity-50'
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-3 flex-wrap mb-2'>
                                  <h3 className='font-semibold text-base tracking-tight truncate'>
                                    {order.orderNumber}
                                  </h3>
                                  <Chip
                                    size='sm'
                                    color={getStatusColor(order.orderStatus)}
                                    variant='flat'
                                    className='font-medium'>
                                    {formatStatus(order.orderStatus)}
                                  </Chip>
                                </div>
                                <div className='flex items-center gap-2 text-sm text-default-500 flex-wrap'>
                                  <span className='font-space'>
                                    {order.createdAt
                                      ? new Date(
                                          order.createdAt,
                                        ).toLocaleDateString('en-US', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                        })
                                      : 'N/A'}
                                  </span>
                                  <span>•</span>
                                  <span className='font-space'>
                                    {order.items.length} item
                                    {order.items.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className='flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-none pt-4 sm:pt-0'>
                              <div className='text-left sm:text-right'>
                                <p className='text-xs text-default-500 uppercase tracking-wider mb-1'>
                                  Total
                                </p>
                                <p className='text-xl font-space font-semibold'>
                                  ${formatPrice(order.totalCents)}
                                </p>
                              </div>
                              <Icon name='chevron-right' className='size-4' />
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              </ViewTransition>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileBackground = memo(() => {
  const {theme} = useTheme()

  // Derive star color during render (simple expression, no need for useMemo)
  const starColor = theme === 'dark' ? '#fff' : '#ccc'

  return (
    <Ascend
      starColor={starColor}
      className={cn(
        'flex items-center justify-center absolute z-0 pointer-events-none inset-0',
        'dark:bg-[radial-gradient(ellipse_at_bottom,#262626_0%,#000_60%)] _bg-[radial-gradient(ellipse_at_bottom,_#f5f5f5_0%,_#fff_50%)]',
      )}
    />
  )
})

ProfileBackground.displayName = 'ProfileBackground'
