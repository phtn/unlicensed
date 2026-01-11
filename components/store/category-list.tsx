'use client'

import {api} from '@/convex/_generated/api'
import {Doc} from '@/convex/_generated/dataModel'
import {useMobile} from '@/hooks/use-mobile'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Card, CardBody, CardFooter, Image} from '@heroui/react'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {memo, useMemo} from 'react'
import {HyperList} from '../expermtl/hyper-list'

export const CategoryList = memo(() => {
  const router = useRouter()
  const isMobile = useMobile()
  const categories = useQuery(api.categories.q.listCategories)

  // Get all heroImage storage IDs for URL resolution
  const heroImages = useMemo(
    () => categories?.map((item) => item.heroImage).filter(Boolean) ?? [],
    [categories],
  )

  // Resolve storageIds to URLs
  const resolveUrl = useStorageUrls(heroImages)

  const prefetchFn = (slug: string) => () => router.prefetch(slug)
  const data = categories
    ?.slice()
    .map((c) => ({...c, prefetchFn, resolveUrl})) as Array<CategoryItemProps>

  return (
    <HyperList
      direction='right'
      component={CategoryItem}
      disableAnimation={isMobile}
      container='gap-8 grid grid-cols-2 sm:grid-cols-5'
      data={data}
    />
  )
})

CategoryList.displayName = 'CategoryList'

interface CategoryItemProps extends Doc<'categories'> {
  prefetchFn: (slug: string) => () => void
  resolveUrl: (storageId: string) => string | null
}

const CategoryItem = (item: CategoryItemProps) => {
  return (
    <Card
      as={Link}
      key={item._id}
      href={`/lobby/category/${item.slug}`}
      prefetch
      radius='sm'
      className='border-none'
      isFooterBlurred
      isPressable
      shadow='none'
      onMouseEnter={item.prefetchFn(`/lobby/category/${item.slug}`)}>
      <CardBody className='overflow-visible p-0'>
        <Image
          alt={item.name}
          radius='none'
          shadow='none'
          className='w-full object-cover min-size-[172px]'
          src={item.resolveUrl(item.heroImage ?? '') ?? undefined}
          width='100%'
          loading='lazy'
        />
      </CardBody>
      <CardFooter className='absolute z-30 bottom-0 text-xl h-10 font-fugaz font-light justify-between text-white'>
        <p className='capitalize'>{item.name}</p>
        {/*<p className='text-default-500'>{item.href}</p>*/}
      </CardFooter>
    </Card>
  )
}
