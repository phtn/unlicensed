'use client'

import {Loader} from '@/components/expermtl/loader'
import {TextureCardStyled} from '@/components/ui/texture-card'
import {api} from '@/convex/_generated/api'
import {useAuth} from '@/hooks/use-auth'
import {Icon} from '@/lib/icons'
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
import {
  Award,
  Box,
  ChevronRight,
  ChevronUp,
  Package,
  Percent,
  Sparkles,
  Truck,
} from 'lucide-react'
import NextLink from 'next/link'
import {startTransition, useMemo, useState, ViewTransition} from 'react'
import {UserStatsCard} from '../account/_components/user-stats-card'

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
      case 'pending':
        return 'warning'
      case 'confirmed':
      case 'processing':
        return 'primary'
      case 'shipped':
        return 'secondary'
      case 'delivered':
        return 'success'
      case 'cancelled':
      case 'refunded':
        return 'danger'
      default:
        return 'default'
    }
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
    <div className='min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header Section */}
        <div className='pt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
          <div>
            <p className='text-dark-gray dark:text-light-gray font-fugaz'>
              Welcome back, {convexUser?.name?.split(' ')[0] || 'User'}
            </p>
          </div>
          {userRewards?.currentTier && (
            <Chip
              variant='shadow'
              classNames={{
                base: 'bg-gradient-to-br from-indigo-500 to-pink-500 border-small border-white/50 shadow-pink-500/30',
                content:
                  'drop-shadow shadow-black text-white font-semibold tracking-wider',
              }}
              size='lg'
              startContent={<Award size={18} className='text-white' />}>
              {userRewards.currentTier.name.toUpperCase()} MEMBER
            </Chip>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Column: Profile & Loyalty (1/3 width) */}
          <div className='space-y-8 lg:col-span-1'>
            {/* Profile Card */}
            <TextureCardStyled className='p-6 h-120 bg-transparent rounded-[3rem]'>
              <div className='flex h-full flex-col items-center text-center space-y-4'>
                <div className='relative h-full flex flex-col justify-center'>
                  <div className='size-24 rounded-full p-1 bg-linear-to-tl from-brand/40 to-pink-500'>
                    <div className='w-full h-full rounded-full overflow-hidden border-4 border-background bg-background'>
                      {convexUser?.photoUrl || firebaseUser?.photoURL ? (
                        <Image
                          src={
                            convexUser?.photoUrl || firebaseUser?.photoURL || ''
                          }
                          alt='Profile'
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center bg-default-100 text-4xl font-bold text-default-500'>
                          {(
                            convexUser?.name ||
                            firebaseUser?.displayName ||
                            'U'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  {userRewards?.isVIP && (
                    <div className='absolute -bottom-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-background'>
                      VIP
                    </div>
                  )}
                </div>

                <div>
                  <h2 className='text-lg font-bold'>
                    {convexUser?.name ?? firebaseUser?.displayName}
                  </h2>
                  <p className='text-sm text-blue-500'>
                    {convexUser?.email ?? firebaseUser?.email}
                  </p>
                </div>

                <div className='w-full pt-4 border-t border-default-200/50 grid grid-cols-2 gap-4'>
                  <div className='text-center p-4 rounded-3xl'>
                    <p className='text-xs uppercase tracking-wider'>Orders</p>
                    <p className='text-xl font-bold'>
                      {orderStats?.totalOrders ?? 0}
                    </p>
                  </div>
                  <div className='text-right p-4 space-y-1 rounded-3xl'>
                    {/*<p className='text-xs uppercase tracking-wider'>Spent</p>*/}
                    <div className=' flex items-center space-x-2 text-xl text-foreground font-medium font-geist-sans'>
                      {/*<span>
                        <Icon
                          onClick={handleToggleVisibleSpent}
                          name={visibleSpent ? 'eye' : 'eye-slash'}
                          className='opacity-80 size-5 cursor-pointer'
                        />
                      </span>*/}
                      {/*<ViewTransition>
                        <span>
                          {visibleSpent
                            ? formatPrice(orderStats?.totalSpent ?? 0)
                            : '****'}
                        </span>
                      </ViewTransition>*/}
                    </div>
                  </div>
                </div>
              </div>
            </TextureCardStyled>

            {/* Points Balance Card */}
            {pointsBalance && (
              <Card className='border-none shadow-md bg-linear-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md'>
                <CardBody className='p-6 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-semibold flex items-center gap-2'>
                      <Sparkles className='size-4 text-purple-500' />
                      Reward Points
                    </h3>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-baseline gap-2'>
                      <span className='text-3xl font-bold text-purple-600 dark:text-purple-400'>
                        {pointsBalance.availablePoints.toLocaleString()}
                      </span>
                      <span className='text-sm text-default-500'>points</span>
                    </div>
                    {nextVisitMultiplier && (
                      <div className='pt-2 border-t border-default-200/50'>
                        <div className='flex items-center justify-between text-sm mb-1'>
                          <span className='text-default-500'>
                            Next Visit Multiplier
                          </span>
                          <span className='font-semibold text-purple-600 dark:text-purple-400'>
                            {nextVisitMultiplier.multiplier}x
                          </span>
                        </div>
                        <p className='text-xs text-default-500'>
                          {nextVisitMultiplier.message}
                        </p>
                      </div>
                    )}
                    <div className='text-xs text-default-500 pt-1'>
                      Lifetime: {pointsBalance.totalPoints.toLocaleString()}{' '}
                      points
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Loyalty Progress Card */}
            {userRewards?.nextTier && (
              <Card className='border-none shadow-md bg-content1/50 backdrop-blur-md'>
                <CardBody className='p-6 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='font-semibold flex items-center gap-2'>
                      <Award className='size-4 text-primary' />
                      Next Reward Tier
                    </h3>
                    <span className='text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full'>
                      {userRewards.nextTier.name}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-default-500'>Progress</span>
                      <span className='font-medium'>
                        {Math.round(nextTierProgress)}%
                      </span>
                    </div>
                    <Progress
                      value={nextTierProgress}
                      color='secondary'
                      className='h-2'
                      classNames={{
                        indicator:
                          'bg-gradient-to-r from-indigo-500 to-pink-500',
                      }}
                    />
                    <p className='text-xs text-default-500 text-center'>
                      Spend{' '}
                      <span className='font-bold text-foreground'>
                        ${formatPrice(spendToNextTier)}
                      </span>{' '}
                      more to reach {userRewards.nextTier.name} status
                    </p>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Benefits Summary */}
            <Card className='border-none shadow-sm'>
              <CardBody className='p-0'>
                <div className='px-4 py-3 border-b border-default-100 font-semibold text-sm'>
                  Your Member Benefits
                </div>
                <div className='p-2'>
                  {tierBenefits?.discountPercentage ? (
                    <div className='flex items-center gap-3 p-4 hover:bg-default-50 rounded-lg transition-colors'>
                      <div className='p-2 rounded-full bg-green-100 text-green-600'>
                        <Percent size={16} />
                      </div>
                      <div>
                        <p className='text-sm font-medium'>
                          {tierBenefits.discountPercentage}% OFF
                        </p>
                        <p className='text-xs text-default-500'>
                          On all orders
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {tierBenefits?.freeShipping && (
                    <div className='flex items-center gap-3 p-4 hover:bg-default-50 rounded-lg transition-colors'>
                      <div className='p-2 rounded-full bg-blue-100 text-blue-600'>
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Free Shipping</p>
                        <p className='text-xs text-default-500'>
                          On all eligible orders
                        </p>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center gap-3 p-4 hover:bg-default-50 rounded-lg transition-colors'>
                    <div className='p-2 rounded-full bg-brand/40 dark:bg-brand/60 text-dark-gray dark:text-white'>
                      <Icon name='user' size={16} />
                    </div>
                    <div>
                      <p className='text-[15px] font-medium'>Member Access</p>
                      <p className='text-xs text-default-500'>
                        Exclusive drops & events
                      </p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column: Stats & Orders (2/3 width) */}
          <div className='lg:col-span-2 space-y-8'>
            {/* Quick Stats Grid */}
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              <UserStatsCard
                label='total orders'
                value={orderStats?.totalOrders || 0}
                icon='bag-solid'
              />
              <UserStatsCard
                label='total spent'
                value={'$' + formatPrice(orderStats?.totalSpent || 0)}
                icon='money-duotone'
              />
              <UserStatsCard
                label='total rewards'
                value={formatPrice(userRewards?.totalPoints || 0)}
                icon='diamond-duotone'
              />
              <UserStatsCard
                label='current rewards'
                value={(tierBenefits?.discountPercentage ?? 0) + '%'}
                icon='money-duotone'
              />
            </div>

            {/* Recent Orders Section */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-bold'>
                  {showAllOrders ? 'All Orders' : 'Recent Orders'}
                </h2>
                <Button
                  variant='light'
                  onPress={toggleShowAllOrders}
                  endContent={
                    showAllOrders ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )
                  }
                  className='text-default-500 hover:text-foreground'>
                  {showAllOrders ? 'Show Less' : 'View All'}
                </Button>
              </div>

              <ViewTransition>
                <div className='space-y-4 min-h-[100px]'>
                  {recentOrders === undefined ? (
                    <div className='w-full flex justify-center items-center py-12'>
                      <Loader />
                    </div>
                  ) : recentOrders.length === 0 ? (
                    <Card className='border-dashed border-2 border-default-200 bg-transparent'>
                      <CardBody className='py-12 flex flex-col items-center justify-center text-center'>
                        <div className='w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mb-4 text-default-400'>
                          <Package size={32} />
                        </div>
                        <h3 className='text-lg font-medium text-foreground'>
                          No orders yet
                        </h3>
                        <p className='text-default-500 max-w-xs mt-2'>
                          Start shopping to see your orders and earn rewards!
                        </p>
                        <Button
                          as={NextLink}
                          href='/products'
                          color='primary'
                          className='mt-6'>
                          Browse Products
                        </Button>
                      </CardBody>
                    </Card>
                  ) : (
                    recentOrders.map((order) => (
                      <Card
                        key={order._id}
                        as={NextLink}
                        href={`/account/orders/${order._id}`}
                        isPressable
                        className='w-full hover:scale-[1.01] transition-transform'>
                        <CardBody className='p-2'>
                          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                            <div className='flex items-start gap-4'>
                              <div className='p-3 bg-default-100 rounded-xl hidden sm:block'>
                                <Box size={24} className='text-default-500' />
                              </div>
                              <div>
                                <div className='flex items-center gap-4'>
                                  <h3 className='font-semibold text-base'>
                                    {order.orderNumber}
                                  </h3>
                                  <Chip
                                    size='sm'
                                    color={getStatusColor(order.orderStatus)}
                                    variant='flat'>
                                    {order.orderStatus.toUpperCase()}
                                  </Chip>
                                </div>
                                <p className='font-space text-sm opacity-60 mt-1'>
                                  {order.createdAt
                                    ? new Date(order.createdAt).toLocaleDateString(
                                        'en-US',
                                        {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                        },
                                      )
                                    : 'N/A'}{' '}
                                  • {order.items.length} Items
                                </p>
                              </div>
                            </div>

                            <div className='flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-none pt-4 sm:pt-0'>
                              <div className='text-left sm:text-right'>
                                <p className='text-xs text-default-500 uppercase tracking-wider'>
                                  Total
                                </p>
                                <p className='text-lg font-bold text-primary'>
                                  ${formatPrice(order.totalCents)}
                                </p>
                              </div>
                              <ChevronRight className='text-default-300' />
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
