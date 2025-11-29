import {Badge} from '@/components/main/badge'

export const BadgeList = () => {
  return (
    <main className='flex items-center justify-center min-h-screen'>
      <div className='w-full max-w-4xl px-6 py-12'>
        {/* Title */}
        <div className='text-center mb-16'>
          <h1 className='text-5xl font-black text-white mb-3'>Modern Badges</h1>
          <p className='text-lg text-gray-400'>
            High-fidelity, sharp & vibrant neon components
          </p>
        </div>
        <div className='flex items-center justify-between w-full max-w-5xl'></div>

        {/* Badge Grid - Main Variants */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-12 mb-16'>
          {/* NEW Badge */}
          <div className='flex flex-col items-center gap-4'>
            <Badge variant='new' size='md'>
              NEW
            </Badge>
            <div className='text-center'>
              <p className='text-sm text-gray-400 font-mono'>
                variant=&quot;new&quot;
              </p>
              <p className='text-xs text-gray-600 mt-1'>Magenta Glow</p>
            </div>
          </div>

          {/* FEATURES Badge */}
          <div className='flex flex-col items-center gap-4'>
            <Badge variant='features' size='lg'>
              FEATURED
            </Badge>
            <div className='text-center'>
              <p className='text-sm text-gray-400 font-mono'>
                variant=&quot;features&quot;
              </p>
              <p className='text-xs text-gray-600 mt-1'>Cyan Glow</p>
            </div>
          </div>

          {/* SALE Badge */}
          <div className='flex flex-col items-center gap-4'>
            <Badge variant='sale' size='md'>
              SALE
            </Badge>
            <div className='text-center'>
              <p className='text-sm text-gray-400 font-mono'>
                variant=&quot;sale&quot;
              </p>
              <p className='text-xs text-gray-600 mt-1'>Purple Glow</p>
            </div>
          </div>

          {/* LIMITED Badge */}
          <div className='flex flex-col items-center gap-4'>
            <Badge variant='limited' size='md'>
              LIMITED
            </Badge>
            <div className='text-center'>
              <p className='text-sm text-gray-400 font-mono'>
                variant=&quot;limited&quot;
              </p>
              <p className='text-xs text-gray-600 mt-1'>Lime Glow</p>
            </div>
          </div>
        </div>
        {/* Size Variants */}
        <div className='border-t border-gray-800 pt-6 mb-6'>
          <h2 className='text-2xl font-black text-white mb-8'>Size Variants</h2>
          <div className='flex gap-8 items-start'>
            <div className='flex items-center gap-4'>
              <Badge variant='new' size='sm'>
                SMALL
              </Badge>
              <span className='text-sm text-gray-500'>size=&quot;sm&quot;</span>
            </div>
            <div className='flex items-center gap-4'>
              <Badge variant='features' size='md'>
                MEDIUM
              </Badge>
              <span className='text-sm text-gray-500'>size=&quot;md&quot;</span>
            </div>
            <div className='flex items-center gap-4'>
              <Badge variant='sale' size='lg'>
                LARGE
              </Badge>
              <span className='text-sm text-gray-500'>size=&quot;lg&quot;</span>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className='border-t border-gray-800 pt-12'>
          <h2 className='text-2xl font-black text-white mb-8'>
            Usage Examples
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-gray-900/50 border border-gray-800 p-6 rounded-lg'>
              <p className='text-purple-400 text-sm font-mono mb-2'>
                {'<Badge variant="new">'}
              </p>
              <p className='text-gray-400 text-xs'>NEW</p>
              <p className='text-gray-600 text-xs mt-3'>{'</Badge>'}</p>
            </div>
            <div className='bg-gray-900/50 border border-gray-800 p-6 rounded-lg'>
              <p className='text-blue-400 text-sm font-mono mb-2'>
                {'<Badge variant="features">'}
              </p>
              <p className='text-gray-400 text-xs'>FEATURED</p>
              <p className='text-gray-600 text-xs mt-3'>{'</Badge>'}</p>
            </div>
            <div className='bg-gray-900/50 border border-gray-800 p-6 rounded-lg'>
              <p className='text-light-gray text-sm font-mono mb-2'>
                {'<Badge variant="sale">'}
              </p>
              <p className='text-gray-400 text-xs'>SALE</p>
              <p className='text-gray-600 text-xs mt-3'>{'</Badge>'}</p>
            </div>
            <div className='bg-gray-900/50 border border-gray-800 p-6 rounded-lg'>
              <p className='text-lime-400 text-sm font-mono mb-2'>
                {'<Badge variant="limited">'}
              </p>
              <p className='text-gray-400 text-xs'>LIMITED</p>
              <p className='text-gray-600 text-xs mt-3'>{'</Badge>'}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
