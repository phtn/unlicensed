import {HyperBadge} from '@/components/main/badge'

export const BadgeList = () => {
  return (
    <main className='flex items-start justify-center min-h-screen'>
      <div className='w-full max-w-6xl px-6 pb-12'>
        <div className='text-center mb-16'>
          <h1 className='text-5xl font-black text-foreground mb-3'>
            Modern Badges
          </h1>
          <p className='text-lg text-gray-400'>
            High-fidelity, sharp & vibrant neon components
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-6 place-items-center'>
          <HyperBadge variant='new' />
          <HyperBadge variant='sale' />
          <HyperBadge variant='feature' />
          <HyperBadge variant='limited' />
          <HyperBadge variant='rare' />
          <HyperBadge variant='deal' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-6 py-10 place-items-center w-full'>
          <HyperBadge variant='new' size='sm' />
          <HyperBadge variant='sale' size='sm' />
          <HyperBadge variant='feature' size='sm' />
          <HyperBadge variant='limited' size='sm' />
          <HyperBadge variant='rare' size='sm' />
          <HyperBadge variant='deal' size='sm' />
        </div>
      </div>
    </main>
  )
}
