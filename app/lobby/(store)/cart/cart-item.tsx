import {ClassName} from '@/app/types'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {Button, Card, CardBody, Image} from '@heroui/react'
import {useMemo, useState} from 'react'

interface CartItemProps {
  item: {
    product: ProductType & {
      _id: Id<'products'>
    }
    quantity: number
    denomination?: number
  }
  itemPrice: number
  onUpdate: (
    productId: Id<'products'>,
    quantity: number,
    denomination?: number,
  ) => Promise<void>
  onRemove: (productId: Id<'products'>, denomination?: number) => Promise<void>
  className?: ClassName
}

export const CartItem = ({
  item,
  itemPrice,
  onUpdate,
  onRemove,
  className,
}: CartItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity)

  // Resolve product image URL
  const resolveUrl = useStorageUrls(
    item.product.image ? [item.product.image] : [],
  )
  const productImageUrl = useMemo(
    () => (item.product.image ? resolveUrl(item.product.image) : ''),
    [resolveUrl, item.product.image],
  )

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await onRemove(item.product._id, item.denomination)
    } else {
      setQuantity(newQuantity)
      await onUpdate(item.product._id, newQuantity, item.denomination)
    }
  }

  return (
    <Card
      shadow='none'
      radius='none'
      className={cn(
        'border border-b-0 last:border-b border-foreground/50 bg-white dark:bg-background dark:border-foreground/50 border-dashed first:rounded-t-3xl last:rounded-b-3xl',
        className,
      )}>
      <CardBody>
        <div className='flex gap-4'>
          <div className='relative size-20 md:w-28 md:h-28 shrink-0 rounded-lg overflow-hidden'>
            <Image
              src={productImageUrl ?? undefined}
              alt={item.product.name}
              className='w-full h-full object-cover'
            />
          </div>
          <div className='flex-1 flex flex-col gap-2 py-2'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='font-semibold text-xl'>{item.product.name}</h3>
                {item.denomination && (
                  <p className='text-xs text-muted-foreground'>
                    {item.denomination}
                    {item.product.unit ?? ''}
                  </p>
                )}
              </div>
              <p className='font-medium text-xl font-space'>
                $
                <AnimatedNumber
                  mass={1.2}
                  stiffness={60}
                  value={(itemPrice * quantity) / 100}
                />
              </p>
            </div>
            <div className='flex items-center justify-between mt-auto'>
              <div className='flex items-center gap-2'>
                <Button
                  isIconOnly
                  size='sm'
                  variant='flat'
                  onPress={() => handleQuantityChange(quantity - 1)}>
                  <Icon name='minus' className='size-4' />
                </Button>

                <p className='font-space px-4'>
                  <AnimatedNumber value={quantity} />
                </p>

                <Button
                  isIconOnly
                  size='sm'
                  variant='flat'
                  onPress={() => handleQuantityChange(quantity + 1)}>
                  <Icon name='plus' className='size-4' />
                </Button>
              </div>
              <Button
                size='sm'
                isIconOnly
                variant='light'
                onPress={() => onRemove(item.product._id, item.denomination)}>
                <Icon name='trash' className='size-5 md:size-6 opacity-80' />
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
