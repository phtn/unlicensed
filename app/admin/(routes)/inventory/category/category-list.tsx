'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Card, Image} from '@heroui/react'
import Link from 'next/link'
import {parseAsString, useQueryState} from 'nuqs'
import {useCallback, useMemo} from 'react'

interface CurrentCategoriesProps {
  categories: Array<Doc<'categories'>> | undefined
}

export const CategoryList = ({categories}: CurrentCategoriesProps) => {
  const [, setSlug] = useQueryState('slug', parseAsString.withDefault(''))
  const heroImages = useMemo(
    () => categories?.map((item) => item.heroImage) ?? [],
    [categories],
  )
  const resolveUrl = useStorageUrls(heroImages)

  const handleCategoryClick = useCallback(
    (s: string) => () => {
      console.log('[SLUG]', s)
      setSlug(s)
    },
    [setSlug],
  )

  return (
    <section>
      <h3 className='text-2xl tracking-tighter font-semibold py-2'>
        Active Categories
      </h3>
      {categories?.length === 0 ? (
        <p className='mt-3 text-sm text-neutral-500'>
          No categories yet. Create one above to get started.
        </p>
      ) : (
        <ul className='grid gap-3 md:grid-cols-3'>
          {categories?.map((category) => (
            <li key={category._id} className=''>
              <Card
                as={Link}
                href={`/admin/inventory/category?slug=${category.slug}`}
                onPress={handleCategoryClick(category.slug!)}
                className='p-4 hover:bg-neutral-50 min-h-32 dark:hover:bg-dark-table/30 dark:bg-dark-table/40 transition-colors cursor-pointer '>
                <div className='flex items-center w-full space-x-4'>
                  <Image
                    alt={category.name + '-image'}
                    src={
                      category.heroImage
                        ? resolveUrl(category.heroImage)
                        : '/default-category-image.svg'
                    }
                    className='w-24 h-auto shrink-0 aspect-square'
                  />
                  <div className='flex items-start justify-between w-full h-12'>
                    <h4 className='capitalize tracking-tight font-semibold '>
                      {category.name}
                    </h4>
                    <p className='text-xs italic text-neutral-500'>
                      {category.slug}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
