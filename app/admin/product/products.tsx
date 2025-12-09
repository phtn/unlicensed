import {HyperBadge} from '@/components/main/badge'
import {Doc} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, CardFooter, CardHeader, Image} from '@heroui/react'

export const ProductItem = ({product}: {product: Doc<'products'>}) => (
  <Card
    isFooterBlurred
    className='rounded-xs w-full h-[200px] col-span-12 sm:col-span-7 bg-linear-to-b from-dark-gray/50 from-10% via-transparent to-transparent border-t-[0.33px] border-dark-gray/60 dark:border-dark-gray/80'>
    <CardHeader className='absolute z-10 top-0 flex-col items-start p-1'>
      <h4 className='text-white/90 font-medium text-lg tracking-tight'>
        {product.name}
      </h4>
      <div className='flex items-center justify-between w-full'>
        <p className='text-tiny opacity-70 uppercase font-bold'>
          {product.categorySlug}
        </p>
        {product.featured && <HyperBadge variant='featured' size='xs' />}
      </div>
    </CardHeader>
    <Image
      removeWrapper
      alt={product.name}
      className='z-0 w-full h-full object-cover rounded-xs'
      src={product.image}
    />
    <CardFooter className='p-1.5 absolute bg-black/80 bottom-0 z-10 border border-dark-gray/20 dark:border-dark-gray/80 rounded-b-xs'>
      <div className='flex grow gap-2 items-center'>
        <div className='flex flex-col'>
          <p className='text-tiny text-white'>
            Stock:{' '}
            <span className='text-blue-400 text-sm font-medium tracking-tight'>
              {product.stock}
              {product.unit}
            </span>
          </p>
          <p className='text-tiny text-white'>
            Status:{' '}
            <span
              className={cn(
                'text-emerald-400 text-sm font-medium tracking-tight',
                {
                  'text-orange-300': !product.available,
                },
              )}>
              {product.available ? 'Available' : 'Not Available'}
            </span>
          </p>
        </div>
      </div>
      <Button
        radius='full'
        size='sm'
        isIconOnly
        variant='flat'
        className='text-white font-semibold hover:bg-dark-gray bg-dark-gray'>
        <Icon name='eye' className='size-5' />
      </Button>
    </CardFooter>
  </Card>
)

interface CurrentProductsProps {
  products: Doc<'products'>[] | undefined
}

export const CurrentProducts = ({products}: CurrentProductsProps) => {
  return (
    <section className='px-2 h-[83lvh] overflow-auto'>
      {products?.length === 0 ? (
        <p className='text-sm text-neutral-500'>
          No products yet. Create one above to get started.
        </p>
      ) : (
        <ul className='grid gap-px grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6'>
          {products?.map((product) => (
            <li key={product._id}>
              <ProductItem product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
