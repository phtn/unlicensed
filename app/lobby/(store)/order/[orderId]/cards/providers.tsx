import {ClassName} from '@/app/types'
import {TopTenProvider} from '@/convex/paygateAccounts/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useCallback, useState} from 'react'

interface TopProvidersProps {
  providers: Array<TopTenProvider>
  onSelectProvider: (providerId: string) => void
  selectedProviderId?: string | null
  totalAmount: number
}
export const TopProviders = ({
  providers,
  onSelectProvider,
  selectedProviderId = null,
  totalAmount,
}: TopProvidersProps) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const handleHover = useCallback(
    (id: string | null) => () => {
      setHovered(id)
    },
    [],
  )
  const handleSelect = useCallback(
    (providerId: string) => () => {
      onSelectProvider(providerId)
    },
    [onSelectProvider],
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 lg:gap-12'>
      {providers.map((provider) => (
        <button
          key={provider.id}
          type='button'
          onMouseEnter={handleHover(provider.id)}
          onMouseLeave={handleHover(null)}
          onClick={handleSelect(provider.id)}
          aria-label={`Pay with ${provider.provider_name}`}
          disabled={
            selectedProviderId !== null ||
            provider.minimum_amount > totalAmount / 100
          }
          className='group relative text-left'>
          {/* Card */}
          <div
            className={cn(
              'relative bg-linear-to-r from-alum/20 to-white dark:from-dark-table dark:to-dark-table/80 rounded-xl p-4 sm:p-8 md:p-10 h-full',
              'group-hover:ring-1 group-hover:ring-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-primary group-disabled:opacity-70',
              'cursor-pointer border border-stone-900/50 outline-none transition-all duration-300',
              {
                'group-hover:ring-red-400 dark:group-hover:ring-red-400/50 to-red-100':
                  provider.minimum_amount > totalAmount / 100,
              },
            )}>
            <div
              className={cn(
                'absolute top-0 left-8 md:left-10 h-1 w-16 opacity-50',
                'rounded-b-full border-b dark:border-background dark:bg-background',
                'transition-all duration-500',
                {
                  'bg-red-400 dark:bg-red-400 border-b-red-400 opacity-80':
                    provider.minimum_amount > totalAmount / 100,
                },
              )}
            />
            <div className='flex items-center space-x-1 md:space-x-4 lg:space-x-6 text-xl lg:text-5xl mb-3 transition-transform duration-500 group-hover:scale-101 group-hover:translate-y-0'>
              <div
                className={cn(
                  'h-12 w-12 md:h-16 md:w-16 flex items-center justify-center aspect-square rounded-lg',
                  cmap[provider.id],
                )}>
                <Icon
                  name={provider.id as IconName}
                  className={cn('size-8 dark:text-background', {
                    'text-white dark:text-white':
                      provider.id === 'moonpay' ||
                      provider.id === 'rampnetwork',
                  })}
                />
              </div>
              <div className='ps-4 '>
                <div className='flex items-center space-y-1 space-x-6'>
                  <h3 className='text-base md:text-xl lg:text-2xl font-polysans md:font-pixel-line text-slate-900 dark:text-white tracking-wide whitespace-nowrap'>
                    {provider.provider_name}
                  </h3>
                  <h3 className='hidden md:flex text-base md:text-xl font-okxs text-slate-900 dark:text-white'>
                    {provider.id === 'robinhood' ? (
                      <span className='underline underline-offset-2 decoration-0.5 decoration-robinhood'>
                        3% Discount
                      </span>
                    ) : (
                      '5% Surcharge'
                    )}
                  </h3>
                </div>
                <div className='flex items-center space-x-2 md:space-x-4'>
                  <p className='text-sm text-emerald-600 dark:text-emerald-500 font-brk md:font-pixel-sqr font-thin leading-relaxed uppercase tracking-widest'>
                    {provider.status}
                  </p>
                  <span className='opacity-30 text-sm'>|</span>
                  <span
                    className={cn('font-okxs text-base', {
                      'text-red-500 dark:text-red-400':
                        provider.minimum_amount > totalAmount / 100,
                    })}>
                    <span className={cn('opacity-50')}>Min</span> $
                    {provider.minimum_amount}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <h3 className='flex text-sm md:text-xl font-okxs text-slate-900 dark:text-white'>
                {provider.id === 'robinhood' ? (
                  <span className='underline underline-offset-2 decoration-0.5 decoration-robinhood'>
                    3% Discount
                  </span>
                ) : (
                  '5% Surcharge'
                )}
              </h3>
              <div className='flex items-center'>
                {selectedProviderId === provider.id && (
                  <div className='absolute right-17 bottom-11 text-xs uppercase tracking-[0.2em] font-pixel-line'>
                    Preparing
                  </div>
                )}
                <Icon
                  name={
                    selectedProviderId === provider.id
                      ? 'spinners-ring'
                      : provider.minimum_amount > totalAmount / 100
                        ? 'x'
                        : 'arrow-right'
                  }
                  className={cn(
                    'transition-all duration-500 transform-gpu opacity-0 -translate-x-14 group-hover:translate-x-3 group-hover:opacity-100 group-hover:text-foreground dark:group-hover:text-slate-100 blur-sm group-hover:blur-none size-6 delay-75',
                    {
                      'size-5': selectedProviderId === provider.id,
                      'group-hover:text-red-500 dark:group-hover:text-red-400':
                        provider.minimum_amount > totalAmount / 100,
                    },
                  )}
                />
                <Icon
                  name={
                    selectedProviderId === provider.id
                      ? 'spinners-ring'
                      : 'arrow-right'
                  }
                  className={cn(
                    'transition-all duration-500 transform group-hover:translate-x-7 group-hover:text-slate-900 group-hover:blur-xs size-6 group-hover:opacity-0',
                    {'size-5': selectedProviderId === provider.id},
                  )}
                />
              </div>
            </div>
            <div
              className={`absolute inset-0 rounded-xl opacity-0
                        transition-opacity duration-500 pointer-events-none
                        bg-linear-to-br from-blue-50/30 to-transparent
                        ${hovered === provider.id ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </button>
      ))}
    </div>
  )
}

const cmap: Record<TopTenProvider['id'], ClassName> = {
  robinhood: 'bg-robinhood',
  moonpay: 'bg-moonpay',
  unlimit: 'bg-unlimit',
  rampnetwork: 'bg-rampnetwork',
}
