'use client'

import {Doc} from '@/convex/_generated/dataModel'
import {useMobile} from '@/hooks/use-mobile'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {Card, CardBody, CardFooter, Image} from '@heroui/react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useMemo} from 'react'
import {HyperList} from '../expermtl/hyper-list'

interface CatergoryListProps {
  categories: Array<Doc<'categories'>> | undefined
}
export const CategoryList = ({categories}: CatergoryListProps) => {
  const router = useRouter()
  const isMobile = useMobile()

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
      container='gap-8 grid grid-cols-2 sm:grid-cols-5 mt-4'
      data={data}
    />
  )
}

interface CategoryItemProps extends Doc<'categories'> {
  prefetchFn: (slug: string) => () => void
  resolveUrl: (storageId: string) => string | null
}

const CategoryItem = (item: CategoryItemProps) => {
  return (
    <Card
      as={Link}
      prefetch
      radius='sm'
      isPressable
      shadow='none'
      key={item._id}
      isFooterBlurred
      className='border-none'
      href={`/lobby/category/${item.slug}`}
      onMouseEnter={item.prefetchFn(`/lobby/category/${item.slug}`)}>
      <CardBody className='relative overflow-visible p-0'>
        <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 scale-100 pointer-events-none" />
        <div className='h-24 w-full overflow-hidden opacity-10 flex items-center justify-center'>
          <Icon name='rapid-fire-logo' className='size-40 animate-pulse' />
        </div>
        <Image
          alt={item.name}
          radius='none'
          shadow='none'
          className='hidden w-full object-cover min-size-[172px]'
          src={item.resolveUrl(item.heroImage ?? '') ?? undefined}
          width='100%'
          loading='lazy'
        />
      </CardBody>
      <CardFooter className='absolute z-30 bottom-0 text-xl flex items-center h-10 font-bone font-light justify-center text-white'>
        <p className='capitalize'>{item.name}</p>
        {/*<p className='text-default-500'>{item.href}</p>*/}
      </CardFooter>
    </Card>
  )
}
