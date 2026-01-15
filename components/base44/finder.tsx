import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {Button, ButtonGroup} from '@heroui/react'
import {useQuery} from 'convex/react'
import {useCallback, useState} from 'react'
import {CategoryList} from '../store/category-list'

export const ShopFinder = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('category')
  const categories = useQuery(api.categories.q.listCategories)
  const handleFilterChange = useCallback(
    (filter: string) => () => setSelectedFilter(filter),
    [],
  )

  return (
    <section className='pb-20 pt-16 px-6 border-b-[0.33px] border-foreground/10 border-dotted overflow-hidden'>
      <div className='relative max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 my-2'>
          <h2 className='text-xl tracking-tight lg:text-3xl font-bone leading-tight'>
            <span className='mr-2 dark:text-white '>
              Experience by {selectedFilter}
            </span>
          </h2>

          <div className='hidden _flex items-center justify-end'>
            <ButtonGroup variant='solid'>
              <Button
                onPress={handleFilterChange('category')}
                className={cn('bg-dark-gray text-white', {
                  'bg-dark-gray/70': selectedFilter === 'category',
                })}>
                Category
              </Button>
              <Button
                onPress={handleFilterChange('mood')}
                className={cn('bg-dark-gray text-white', {
                  'bg-dark-gray/70': selectedFilter === 'mood',
                })}>
                Mood
              </Button>
            </ButtonGroup>
          </div>
        </div>

        <div className='relative min-h-fit overflow-hidden py-0.5 px-0.5'>
          <CategoryList categories={categories} />
        </div>
      </div>
    </section>
  )
}
