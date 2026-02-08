import {TopTenProvider} from '@/convex/paygateAccounts/d'
import {Icon} from '@/lib/icons'
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
    <div className='grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12'>
      {providers.map((provider) => (
        <div
          key={provider.id}
          onMouseEnter={handleHover(provider.id)}
          onMouseLeave={handleHover(null)}
          className='group relative'>
          {/* Card */}
          <div
            className='relative bg-white rounded-xl p-8 md:p-10 h-full cursor-pointer
                      transition-all duration-500 ease-out
                      border border-stone-200/60
                      shadow-sm hover:shadow-xl
                      hover:border-stone-300
                      transform hover:-translate-y-1'>
            {/* Decorative top accent line */}
            <div
              className={`absolute top-0 left-8 md:left-10 h-1 w-16 rounded-b-full
                        transition-all duration-500 ${
                          hovered === provider.id
                            ? 'bg-linear-to-r ' + provider.id
                            : 'bg-stone-200'
                        }`}
            />

            {/* Icon */}
            <div
              className='text-5xl mb-6 transition-transform duration-500
                        group-hover:scale-110 group-hover:translate-y-1'>
              {provider.id}
            </div>

            {/* Content */}
            <div className='mb-8'>
              <h3 className='text-2xl font-light text-slate-900 mb-3 tracking-wide'>
                {provider.provider_name}
              </h3>
              <p className='text-sm md:text-base text-slate-600 font-light leading-relaxed'>
                {provider.status}
              </p>
            </div>

            {/* Arrow indicator */}
            <div className='flex items-center justify-between'>
              <span className='text-xs uppercase tracking-widest text-slate-500 font-medium'>
                Learn more
              </span>
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
