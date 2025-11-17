import {Id} from '@/convex/_generated/dataModel'
import {Icon} from '@/lib/icons'
import {formatPrice} from '@/utils/formatPrice'
import {Button, Card, CardBody, Image} from '@heroui/react'
import {useState} from 'react'

interface CartItemProps {
  item: {
    product: {
      _id: Id<'products'>
      name: string
      image: string
      unit: string
      priceCents: number
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
}

export const CartItem = ({
  item,
  itemPrice,
  onUpdate,
  onRemove,
}: CartItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity)

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
      className='border border-neutral-200 dark:border-neutral-700 border-dashed first:rounded-t-lg last:rounded-b-lg first:border-b-0'>
      <CardBody>
        <div className='flex gap-4'>
          <div className='relative w-28 h-28 shrink-0 rounded-lg overflow-hidden'>
            <Image
              src={item.product.image}
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
                    {item.product.unit}
                  </p>
                )}
              </div>
              <Button
                size='sm'
                isIconOnly
                variant='light'
                onPress={() => onRemove(item.product._id, item.denomination)}>
                <Icon name='x' className='size-4' />
              </Button>
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

                <p className='font-space px-4'>{quantity.toString()}</p>

                <Button
                  isIconOnly
                  size='sm'
                  variant='flat'
                  onPress={() => handleQuantityChange(quantity + 1)}>
                  <Icon name='plus' className='size-4' />
                </Button>
              </div>
              <p className='font-medium text-xl font-space'>
                ${formatPrice(itemPrice * quantity)}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
{
  /*<Input
                  type='number'
                  value={quantity.toString()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    handleQuantityChange(val)
                  }}
                  className='w-16 text-center'
                  min={1}
                />*/
}
