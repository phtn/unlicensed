'use client'
import {Callout, DotDiv} from '@/components/ui/callout'

import {Ascend} from '@/components/expermtl/ascend'
import {Loader} from '@/components/expermtl/loader'
import {useAccount} from '@/hooks/use-account'
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
import {useTheme} from 'next-themes'
import Link from 'next/link'
import {memo, startTransition, useMemo, useState, ViewTransition} from 'react'
import {OrderItem} from './_components/order-item'

export default function AccountPage() {
  const {
    user,
    orders,
    orderStats,
    rewards,
    tierBenefits,
    pointsBalance,
    nextVisitMultiplier,
  } = useAccount()
  const [showAllOrders, setShowAllOrders] = useState(false)

  // Loading State (Initial page load only)
  const isLoading = !user

  // Calculate Progress to Next Tier
  const nextTierProgress = useMemo(() => {
    if (!rewards || !rewards.nextTier) return 100
    const currentSpend = rewards.lifetimeSpendingCents
    const nextTierSpend = rewards.nextTier.minimumSpendingCents || 0
    if (nextTierSpend === 0) return 100
    return Math.min(100, (currentSpend / nextTierSpend) * 100)
  }, [rewards])

  const spendToNextTier = useMemo(() => {
    if (!rewards || !rewards.nextTier) return 0
    const currentSpend = rewards.lifetimeSpendingCents
    const nextTierSpend = rewards.nextTier.minimumSpendingCents || 0
    return Math.max(0, nextTierSpend - currentSpend)
  }, [rewards])

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

  if (isLoading) {
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
            {rewards?.currentTier && (
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
                {rewards.currentTier.name.toUpperCase()} MEMBER
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
                        {user?.photoUrl ? (
                          <Image
                            src={user.photoUrl}
                            alt='Profile'
                            className='size-full object-cover relative z-100'
                          />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center font-polysans font-normal bg-linear-to-br from-indigo-100 to-pink-100 dark:from-indigo-900/30 dark:to-pink-900/30 text-4xl text-white dark:text-indigo-400 '>
                            {(user?.name ?? '').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    {rewards?.isVIP && (
                      <div className='absolute -bottom-1 -right-1 bg-linear-to-br from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-background'>
                        VIP
                      </div>
                    )}
                  </div>
                  <h2 className='text-xl font-bone tracking-tight text-white'>
                    {user?.name}
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
            {rewards?.nextTier && (
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
                      {rewards.nextTier.name}
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
                        {rewards.nextTier.name}
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
                {orders && orders.length > 5 && (
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
                  {orders === undefined ? (
                    <div className='w-full flex justify-center items-center py-16'>
                      <Loader />
                    </div>
                  ) : orders.length === 0 ? (
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
                    orders
                      .slice(0, 5)
                      .map((order) => (
                        <OrderItem key={order.orderNumber} order={order} />
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
