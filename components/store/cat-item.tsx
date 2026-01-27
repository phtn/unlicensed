import {Doc, Id} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {Card, CardBody, CardFooter, Image} from '@heroui/react'
import Link from 'next/link'

interface CategoryItemProps extends Doc<'categories'> {
  resolveUrl: (storageId: string) => string | null
}

export const CategoryItem = (item: CategoryItemProps) => {
  // Resolve storageIds to URLs
  const resolvedImageUrl = useStorageUrls([item.heroImage as Id<'_storage'>])

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
      // onMouseEnter={item.prefetchFn(`/lobby/category/${item.slug}`)}
    >
      <CardBody className='relative overflow-visible p-0'>
        <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('/svg/noise.svg')] opacity-10 scale-100 pointer-events-none" />
        <div className='h-24 w-full overflow-hidden opacity-10 flex items-center justify-center'>
          <Icon name='rapid-fire-logo' className='size-40 animate-pulse' />
        </div>
        <Image
          alt={item.name}
          radius='none'
          shadow='none'
          className='hidden w-full object-cover min-size-[172px]'
          // src={item.resolveUrl(item.heroImage ?? '') ?? undefined}
          src={resolvedImageUrl(item.heroImage as Id<'_storage'>) as string}
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
