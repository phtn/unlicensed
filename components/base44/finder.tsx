import {cn} from '@/lib/utils'
import {Button, ButtonGroup} from '@heroui/react'
import {useCallback, useState} from 'react'
import {CategoryList} from '../store/category-list'

export const ShopFinder = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('category')

  const handleFilterChange = useCallback(
    (filter: string) => () => setSelectedFilter(filter),
    [],
  )

  return (
    <section className='pb-20 px-6 bg-slate-300/80 border-b-[0.33px] border-foreground/40 overflow-hidden'>
      <div className='relative max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 mb-4'>
          <h2 className='text-2xl tracking-tight lg:text-3xl font-fugaz leading-tight'>
            <span className='mr-2'>Shop by</span>
            <span className='text-tertiary-foreground font-space font-semibold capitalize'>
              {selectedFilter}.
            </span>
          </h2>

          <div className='flex items-center justify-end'>
            <ButtonGroup variant='solid'>
              <Button
                onPress={handleFilterChange('category')}
                className={cn('bg-tertiary-foreground text-white', {
                  'bg-tertiary-foreground/70': selectedFilter === 'category',
                })}>
                Category
              </Button>
              <Button
                onPress={handleFilterChange('mood')}
                className={cn('bg-tertiary-foreground text-white', {
                  'bg-tertiary-foreground/70': selectedFilter === 'mood',
                })}>
                Mood
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='absolute rounded-4xl h-40 w-full scale-125 blur-3xl opacity-20 bg-linear-to-br from-brand/60 via-orange-300/60 to-teal-400 p-8 lg:p-4'></div>
        <div className='relative rounded-3xl overflow-hidden bg-linear-to-br from-brand via-brand to-brand dark:from-panel dark:via-panel/70 dark:to-panel/80 p-8 lg:p-8'>
          <CategoryList />
          <div className='hidden relative _grid md:grid-cols-3 gap-6'>
            {/* Card 1 */}
            <div className='bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center'>
              <h3 className='text-2xl lg:text-3xl font-space text-white mb-1'>
                500
              </h3>
              <p className='text-white text-xl font-space'>Relaxing</p>
            </div>

            {/*<div className='bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center'>
              <h3 className='text-4xl lg:text-5xl font-space text-white mb-1'>
                35
              </h3>
              <p className='text-white text-xl'>Elevating</p>
            </div>

            <div className='bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center'>
              <h3 className='text-4xl lg:text-5xl font-space text-white mb-4'>
                45
              </h3>
              <p className='text-white text-xl'>Focused</p>
            </div>*/}
          </div>
        </div>
      </div>
    </section>
  )
}
