import {ClassName} from '@/app/types'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {Id} from '@/convex/_generated/dataModel'
import {ProductType} from '@/convex/products/d'
import {useStorageUrls} from '@/hooks/use-storage-urls'
import {Icon} from '@/lib/icons'
import {cn} from '@/lib/utils'
import {
  Button,
  Card,
  CardBody,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@heroui/react'
import {memo, useEffect, useMemo, useState, useTransition} from 'react'

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

export const CartItem = memo(
  ({item, itemPrice, onUpdate, onRemove, className}: CartItemProps) => {
    const [quantity, setQuantity] = useState(item.quantity)
    const [, startTransition] = useTransition()

    // Sync local quantity with prop when it changes externally
    useEffect(() => {
      startTransition(() => {
        setQuantity(item.quantity)
      })
    }, [item.quantity])

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
        startTransition(async () => {
          await onRemove(item.product._id, item.denomination)
        })
      } else {
        setQuantity(newQuantity) // Optimistic update
        startTransition(async () => {
          await onUpdate(item.product._id, newQuantity, item.denomination)
        })
      }
    }

    const {isOpen, onOpen, onClose} = useDisclosure()

    const handleRemoveConfirmation = () => {
      onOpen()
    }

    const handleConfirmRemove = () => {
      startTransition(async () => {
        await onRemove(item.product._id, item.denomination)
        onClose()
      })
    }

    return (
      <>
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
              <div className='flex-1 flex flex-col gap-3 py-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <h3 className='font-okxs font-semibold text-xl'>
                      {item.product.name}
                    </h3>
                    <div
                      id='price-per-denom'
                      className='flex items-center gap-2 flex-wrap'>
                      {item.denomination != null && (
                        <p className='font-okxs text-xs md:text-sm text-muted-foreground'>
                          {item.denomination}
                          {item.product.unit ?? ''}
                        </p>
                      )}
                      {item.denomination != null && (
                        <p className='font-okxs text-xs md:text-sm text-muted-foreground'>
                          $
                          <span>
                            {itemPrice / 100 / (item.denomination ?? 1)}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <p className='font-medium text-xl font-okxs'>
                    $
                    <AnimatedNumber
                      mass={1.2}
                      stiffness={60}
                      value={(itemPrice * quantity) / 100}
                    />
                  </p>
                </div>
                <div className='flex items-center justify-between mt-auto'>
                  <div className='flex items-center gap-1'>
                    <Button
                      isIconOnly
                      size='sm'
                      radius='none'
                      variant='flat'
                      className='h-7 w-8 rounded-sm'
                      onPress={() => handleQuantityChange(quantity - 1)}>
                      <Icon name='minus' className='size-4' />
                    </Button>

                    <p className='font-okxs font-medium text-lg w-10 text-center'>
                      <AnimatedNumber value={quantity} />
                    </p>

                    <Button
                      isIconOnly
                      size='sm'
                      radius='none'
                      variant='flat'
                      className='h-7 w-8 rounded-sm'
                      onPress={() => handleQuantityChange(quantity + 1)}>
                      <Icon name='plus' className='size-4' />
                    </Button>
                  </div>
                  <Button
                    size='sm'
                    isIconOnly
                    radius='none'
                    variant='light'
                    className='h-7 w-8 rounded-sm opacity-60 hover:opacity-100'
                    onPress={handleRemoveConfirmation}>
                    <Icon name='trash' className='size-5 md:size-6' />
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Modal
          isOpen={isOpen}
          onClose={onClose}
          size='sm'
          placement='center'
          radius='lg'>
          <ModalContent>
            <ModalHeader className='font-okxs font-semibold'>
              Remove item?
            </ModalHeader>
            <ModalBody>
              <p className='text-muted-foreground text-sm'>
                Remove {item.product.name}
                {item.denomination != null
                  ? ` (${item.denomination}${item.product.unit ?? ''})`
                  : ''}{' '}
                from your cart?
              </p>
            </ModalBody>
            <ModalFooter className='gap-2'>
              <Button variant='flat' onPress={onClose}>
                Cancel
              </Button>
              <Button color='danger' onPress={handleConfirmRemove}>
                Remove
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  },
)

CartItem.displayName = 'CartItem'
