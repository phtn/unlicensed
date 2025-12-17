'use client'

import {HyperBadge} from '@/components/main/badge'
import {Doc} from '@/convex/_generated/dataModel'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, CardFooter, CardHeader, Image} from '@heroui/react'
import Link from 'next/link'
import {useMemo} from 'react'

const ProductItem = ({
  product,
  imageUrl,
}: {
  product: Doc<'products'>
  imageUrl: string
}) => (
  <Card
    radius='none'
    isFooterBlurred
    className='w-full h-[200px] col-span-12 sm:col-span-7 bg-linear-to-b from-dark-gray/50 from-10% via-transparent to-transparent dark:border-dark-gray/80'>
    <CardHeader className='absolute z-10 top-0 flex-col items-start px-0 py-0 bg-background/20 backdrop-blur-2xl h-fit'>
      <div className='flex items-center justify-between w-full'>
        <p className='text-xs uppercase font-medium text-white px-0.5'>
          {product.categorySlug}
        </p>
        {product.featured && (
          <span className='scale-80 absolute top-0 right-0'>
            <HyperBadge variant='featured' size='xs' />
          </span>
        )}
      </div>
      <h4 className='capitalize text-white/90 font-medium tracking-tight'>
        {product.name}
      </h4>
    </CardHeader>
    <Image
      radius='none'
      removeWrapper
      alt={product.name}
      className='z-0 w-full h-full object-cover rounded-xs'
      src={imageUrl}
    />
    <CardFooter className='p-1.5 absolute bg-black/80 bottom-0 z-10 border border-dark-gray/20 dark:border-dark-gray/80 rounded-b-xs'>
      <div className='flex grow gap-2 items-center'>
        <div className='flex flex-col'>
          <p className='text-xs text-white'>
            <span
              className={cn('text-emerald-400 font-medium tracking-tight', {
                'text-orange-300': !product.available,
              })}>
              {product.available ? 'Available' : 'Not Available'}
            </span>
          </p>
          <p className='text-tiny text-white'>
            Stock:{' '}
            <span className='text-blue-400 text-sm font-medium tracking-tight'>
              {product.stock}
              <span className='px-1'>{product.unit}</span>
            </span>
          </p>
        </div>
      </div>
      <Button
        size='sm'
        as={Link}
        isIconOnly
        radius='full'
        variant='flat'
        prefetch={true}
        href={`/admin/product/edit/${product._id}`}
        className='text-white font-semibold hover:bg-dark-gray bg-dark-gray'>
        <Icon name='pencil-single-solid' className='size-5' />
      </Button>
    </CardFooter>
  </Card>
)

interface ProductListProps {
  products: Doc<'products'>[] | undefined
}

export const ProductList = ({products}: ProductListProps) => {
  const imageIds = useMemo(
    () => products?.map((p) => p.image).filter(Boolean) ?? [],
    [products],
  )
  const resolveUrl = useStorageUrls(imageIds as string[])

  return (
    <section className='h-[91lvh] overflow-auto'>
      {products?.length === 0 ? (
        <p className='text-sm text-neutral-500'>
          No products yet. Create one above to get started.
        </p>
      ) : (
        <ul className='grid gap-0.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6'>
          {products?.map((product) => (
            <li key={product._id}>
              <ProductItem
                product={product}
                imageUrl={resolveUrl(product.image)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
