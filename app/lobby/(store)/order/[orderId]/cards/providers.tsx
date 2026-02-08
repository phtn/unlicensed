import {ClassName} from '@/app/types'
import {TopTenProvider} from '@/convex/paygateAccounts/d'
import {Icon, IconName} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {useCallback, useState} from 'react'

interface TopProvidersProps {
  providers: Array<TopTenProvider>
}
export const TopProviders = ({providers}: TopProvidersProps) => {
  const [hovered, setHovered] = useState<string | null>(null)
  const handleHover = useCallback(
    (id: string | null) => () => {
      setHovered(id)
    },
    [],
  )

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12'>
      {providers.map((provider) => (
        <div
          key={provider.id}
          onMouseEnter={handleHover(provider.id)}
          onMouseLeave={handleHover(null)}
          className='group relative'>
          {/* Card */}
          <div
            className='relative bg-linear-to-r from-alum/20 to-white dark:from-dark-table dark:to-dark-table/80 rounded-xl p-8 md:p-10 h-full cursor-pointer
                      border border-stone-500/30
                      '>
            {/* Decorative top accent line */}
            <div
              className={`absolute top-0 left-8 md:left-10 h-0.5 w-16 transition-all duration-500 rounded-b-full
                        opacity-50 ${
                          hovered === provider.id
                            ? 'bg-linear-to-r ' +
                              cmap[provider.id] +
                              'to-black border-b'
                            : cmap[provider.id]
                        }`}
            />

            {/* Icon */}
            <div className='flex items-center space-x-6 text-5xl mb-3 transition-transform duration-500 group-hover:scale-101 group-hover:translate-y-0'>
              <div
                className={cn(
                  'h-16 w-16 flex items-center justify-center aspect-square rounded-lg',
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
              <div>
                <h3 className='text-2xl font-okxs text-slate-900 dark:text-white tracking-wide'>
                  {provider.provider_name}
                </h3>
                <p className='text-sm text-emerald-500 font-brk font-thin leading-relaxed uppercase tracking-widest'>
                  {provider.status}
                </p>
              </div>
            </div>

            {/* Arrow indicator */}
            <div className='flex items-center justify-end'>
              <Icon
                name='arrow-right'
                className='text-slate-400 transition-all duration-500
                          transform group-hover:translate-x-2 group-hover:text-slate-900 size-5'
              />
            </div>

            {/* Hover overlay gradient */}
            <div
              className={`absolute inset-0 rounded-xl opacity-0
                        transition-opacity duration-500 pointer-events-none
                        bg-linear-to-br from-blue-50/30 to-transparent
                        ${hovered === provider.id ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </div>
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
