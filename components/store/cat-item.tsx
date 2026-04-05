import {Doc, Id} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {Card} from '@heroui/react'
import Link from 'next/link'


import {LegacyImage} from '@/components/ui/legacy-image'

interface CategoryItemProps extends Doc<'categories'> {
  resolveUrl: (storageId: string) => string | null
}

export const CategoryItem = (item: CategoryItemProps) => {
  // Resolve storageIds to URLs
  const resolvedImageUrl = useStorageUrls([item.heroImage as Id<'_storage'>])

  return (
    <Link href={`/lobby/category/${item.slug}`} prefetch className='block'>
      <Card key={item._id} className='border-none overflow-hidden'>
        <Card.Content className='relative overflow-visible p-0'>
          <div className="absolute w-500 scale-x-50 top-0 -left-150 inset-0 bg-[url('/svg/noise.svg')] opacity-10 scale-100 pointer-events-none" />
          <div className='h-24 w-full overflow-hidden opacity-10 flex items-center justify-center'>
            <Icon name='rapid-fire-logo' className='size-40 animate-pulse' />
          </div>
          <LegacyImage
            alt={item.name}
            className='hidden w-full object-cover min-h-[172px]'
            src={resolvedImageUrl(item.heroImage as Id<'_storage'>) as string}
            loading='lazy'
          />
        </Card.Content>
        <Card.Footer className='absolute z-30 bottom-0 flex h-10 items-center justify-center text-xl font-bone font-light text-white'>
          <p className='capitalize'>{item.name}</p>
        </Card.Footer>
      </Card>
    </Link>
  )
}
