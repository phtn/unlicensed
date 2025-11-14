'use client'

import {useCart} from '@/hooks/use-cart'
import {useAuth} from '@/hooks/use-auth'
import {Button, Card, CardBody, Image, Divider, Input} from '@heroui/react'
import {Icon} from '@/lib/icons'
import {AuthModal} from '@/components/auth/auth-modal'
import {useDisclosure} from '@heroui/react'
import NextLink from 'next/link'
import {useState, useEffect, useMemo} from 'react'
import {Id} from '@/convex/_generated/dataModel'

const formatPrice = (priceCents: number) => {
  const dollars = priceCents / 100
  return dollars % 1 === 0 ? `${dollars.toFixed(0)}` : `${dollars.toFixed(2)}`
}

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
  onUpdate: (productId: Id<'products'>, quantity: number, denomination?: number) => Promise<void>
  onRemove: (productId: Id<'products'>, denomination?: number) => Promise<void>
}

const CartItem = ({item, itemPrice, onUpdate, onRemove}: CartItemProps) => {
  const [quantity, setQuantity] = useState(item.quantity)

  useEffect(() => {
    setQuantity(item.quantity)
  }, [item.quantity])

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await onRemove(item.product._id, item.denomination)
    } else {
      setQuantity(newQuantity)
      await onUpdate(item.product._id, newQuantity, item.denomination)
    }
  }

  return (
    <Card>
      <CardBody>
        <div className='flex gap-4'>
          <div className='relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden'>
            <Image
              src={item.product.image}
              alt={item.product.name}
              className='w-full h-full object-cover'
            />
          </div>
          <div className='flex-1 flex flex-col gap-2'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='font-semibold text-lg'>{item.product.name}</h3>
                {item.denomination && (
                  <p className='text-sm text-color-muted'>
                    {item.denomination} {item.product.unit}
                  </p>
                )}
              </div>
              <Button
                isIconOnly
                variant='light'
                size='sm'
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
                <Input
                  type='number'
                  value={quantity.toString()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1
                    handleQuantityChange(val)
                  }}
                  className='w-16 text-center'
                  min={1}
                />
                <Button
                  isIconOnly
                  size='sm'
                  variant='flat'
                  onPress={() => handleQuantityChange(quantity + 1)}>
                  <Icon name='plus' className='size-4' />
                </Button>
              </div>
              <p className='font-semibold text-lg'>
                ${formatPrice(itemPrice * quantity)}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

export default function CartPage() {
  const {user} = useAuth()
  const {cart, updateItem, removeItem, isLoading, isAuthenticated} = useCart()
  const {isOpen, onOpen, onClose} = useDisclosure()

  // Build cart items from server cart
  const cartItems = useMemo(() => {
    if (cart && cart.items) {
      return cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        denomination: item.denomination,
      }))
    }
    return []
  }, [cart])

  const hasItems = cartItems.length > 0

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading cart...</p>
      </div>
    )
  }


  if (!hasItems) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <Icon name='bag-light' className='size-16 mx-auto text-color-muted' />
          <h1 className='text-2xl font-semibold'>Your cart is empty</h1>
          <Button as={NextLink} href='/' color='primary'>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = cartItems.reduce((total, item) => {
    const price = item.product.priceCents
    const denomination = item.denomination || 1
    return total + price * denomination * item.quantity
  }, 0)

  const tax = subtotal * 0.1 // 10% tax
  const shipping = subtotal > 5000 ? 0 : 500 // Free shipping over $50
  const total = subtotal + tax + shipping

  return (
    <div className='min-h-screen py-24 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <h1 className='text-3xl font-semibold'>Shopping Cart</h1>
        </div>

        <div className='grid gap-8 lg:grid-cols-[1fr_400px]'>
          {/* Cart Items */}
          <div className='space-y-4'>
            {cartItems.map((item) => {
              const product = item.product
              const denomination = item.denomination || 1
              const itemPrice = product.priceCents * denomination

              return (
                <CartItem
                  key={`${product._id}-${item.denomination || 'default'}`}
                  item={item}
                  itemPrice={itemPrice}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              )
            })}
          </div>

          {/* Order Summary */}
          <div className='lg:sticky lg:top-24 h-fit'>
            <Card>
              <CardBody className='space-y-4'>
                <h2 className='text-xl font-semibold'>Order Summary</h2>
                <Divider />
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Subtotal</span>
                    <span>${formatPrice(subtotal)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Tax</span>
                    <span>${formatPrice(tax)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-color-muted'>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className='text-success'>Free</span>
                      ) : (
                        `$${formatPrice(shipping)}`
                      )}
                    </span>
                  </div>
                </div>
                <Divider />
                <div className='flex justify-between text-lg font-semibold'>
                  <span>Total</span>
                  <span>${formatPrice(total)}</span>
                </div>
                {!isAuthenticated && (
                  <div className='p-3 bg-warning/10 border border-warning/20 rounded-lg'>
                    <p className='text-sm text-warning'>
                      Sign in to proceed to checkout
                    </p>
                  </div>
                )}
                <Button
                  color='primary'
                  size='lg'
                  className='w-full font-semibold'
                  as={NextLink}
                  href={isAuthenticated ? '/checkout' : '#'}
                  onPress={!isAuthenticated ? onOpen : undefined}
                  isDisabled={!isAuthenticated}>
                  Proceed to Checkout
                </Button>
                <Button
                  variant='flat'
                  className='w-full'
                  as={NextLink}
                  href='/'>
                  Continue Shopping
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
      <AuthModal isOpen={isOpen} onClose={onClose} mode='login' />
    </div>
  )
}

