'use client'

import {Loader} from '@/components/expermtl/loader'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody} from '@heroui/react'
import {useQuery} from 'convex/react'
import NextLink from 'next/link'
import {useParams} from 'next/navigation'
import {useCallback, useMemo, useState} from 'react'
import {TopProviders} from './providers'

export default function CardProvidersPage() {
  const params = useParams()
  const orderId = params.orderId as Id<'orders'>
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  )
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const order = useQuery(api.orders.q.getById, {id: orderId})
  const paygateAccount = useQuery(api.paygateAccounts.q.getDefaultAccount)

  const providers = useMemo(
    () => paygateAccount?.topTenProviders ?? [],
    [paygateAccount?.topTenProviders],
  )

  const handleProviderSelect = useCallback(
    async (providerId: string) => {
      if (!order) return

      setCheckoutError(null)
      setSelectedProviderId(providerId)

      try {
        const response = await fetch('/api/paygate/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order._id,
            providerId,
          }),
        })

        const data = (await response.json().catch(() => null)) as
          | {success?: boolean; paymentUrl?: string; error?: string}
          | null

        if (!response.ok || !data?.success || !data.paymentUrl) {
          throw new Error(data?.error || 'Unable to start PayGate checkout')
        }

        window.location.href = data.paymentUrl
      } catch (error) {
        setSelectedProviderId(null)
        setCheckoutError(
          error instanceof Error
            ? error.message
            : 'Unable to start PayGate checkout',
        )
      }
    },
    [order],
  )

  if (order === undefined || paygateAccount === undefined) {
    return (
      <div className='h-screen w-screen overflow-hidden pt-100 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <Loader />
      </div>
    )
  }

  if (!order) {
    return (
      <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mx-auto max-w-3xl'>
          <Card radius='sm' shadow='none'>
            <CardBody className='p-6 space-y-4'>
              <h1 className='text-xl font-space'>Order not found</h1>
              <Button as={NextLink} href='/account/orders' color='primary'>
                View Orders
              </Button>
            </CardBody>
          </Card>
        </div>
      </main>
    )
  }

  const fallbackHref = `/lobby/order/${orderId}/pay`

  return (
    <main className='min-h-screen pt-16 lg:pt-28 px-4 sm:px-6 lg:px-8 py-8 dark:bg-black'>
      <div className='mx-auto max-w-7xl space-y-4'>
        <Card radius='none' shadow='none' className='rounded-sm bg-dark-gray/0'>
          <CardBody className='p-2 md:p-6'>
            <div className='flex items-center justify-between w-full'>
              <div className='space-y-1'>
                <div className='flex items-center space-x-5 opacity-60'>
                  <p className='text-xs md:text-sm uppercase tracking-[0.22em] font-pixel-line'>
                    Card Payment
                  </p>
                  <Icon name='applepay' className='size-4 md:size-9' />
                  <Icon name='googlepay' className='size-4 md:size-9' />
                </div>
                <h1 className='text-base md:text-lg lg:text-2xl font-okxs'>
                  Select a payment provider
                </h1>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-end'>
                  <p className='text-sm uppercase tracking-widest font-pixel-line font-light opacity-60'>
                    You Pay
                  </p>
                </div>
                <p className='text-xl md:text-2xl font-okxs font-normal'>
                  ${formatPrice(order.totalCents)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {providers.length === 0 ? (
          <Card radius='sm' shadow='none'>
            <CardBody className='p-6 space-y-4'>
              <p className='text-sm text-default-500'>
                No providers are configured in top ten for the default PayGate
                account.
              </p>
              <Button as={NextLink} href={fallbackHref} color='primary'>
                Continue with default provider
              </Button>
            </CardBody>
          </Card>
        ) : (
          <TopProviders
            providers={providers}
            onSelectProvider={handleProviderSelect}
            selectedProviderId={selectedProviderId}
          />
        )}

        {checkoutError ? (
          <Card radius='sm' shadow='none'>
            <CardBody className='p-6'>
              <p className='text-sm text-danger'>{checkoutError}</p>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </main>
  )
}

// const OldList = ({providers}: {providers: TopTenProvider[]}) => (
// <Card
//   key={provider.id}
//   radius='none'
//   shadow='none'
//   className='min-h-80 rounded-sm bg-dark-table/10'>
//   <CardBody className='p-5 flex items-center justify-between gap-4'>
//     <div className='space-y-1 min-w-0'>
//       <div className='flex items-center gap-2'>
//         <div className='flex items-center text-base font-okxs dark:text-background truncate bg-robinhood py-3 px-6 rounded-full space-x-1'>
//           <Icon name={provider.id as IconName} className='dark:text-black' />
//           <span className='text-xl'>{provider.provider_name}</span>
//         </div>
//         {isDefault && (
//           <span className='text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded bg-primary/15 text-primary'>
//             Default
//           </span>
//         )}
//       </div>
//       <p
//         className={cn(
//           'text-xs uppercase tracking-[0.2em]',
//           providerStatusTone[provider.status],
//         )}>
//         {provider.status}
//       </p>
//       <p className='text-sm text-default-500'>
//         Minimum: {provider.minimum_amount} {provider.minimum_currency}
//       </p>
//     </div>

//     <Button as={NextLink} href={payHref} color='primary'>
//       Continue
//     </Button>
//   </CardBody>
// </Card>
// )
