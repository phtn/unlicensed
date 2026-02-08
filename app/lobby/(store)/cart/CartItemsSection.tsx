import {cn} from '@/lib/utils'
import {getUnitPriceCents} from '@/utils/cartPrice'
import {CartItem} from './cart-item'
import {RecommendedProducts} from './recommended'
import {
  CartItemRemoveHandler,
  CartItemUpdateHandler,
  CartPageItem,
} from './types'

interface CartItemsSectionProps {
  cartItems: CartPageItem[]
  onUpdateItem: CartItemUpdateHandler
  onRemoveItem: CartItemRemoveHandler
}

export function CartItemsSection({
  cartItems,
  onUpdateItem,
  onRemoveItem,
}: CartItemsSectionProps) {
  return (
    <div className='md:h-[70lvh] h-fit bg-linear-to-b dark:from-dark-table/40 via-transparent to-transparent rounded-3xl overflow-hidden flex flex-col'>
      <div className='flex-1 overflow-y-auto rounded-3xl'>
        {cartItems.map((item) => {
          const product = item.product
          const itemPrice = getUnitPriceCents(product, item.denomination)

          return (
            <CartItem
              key={`${product._id}-${item.denomination ?? 'default'}`}
              item={item}
              itemPrice={itemPrice}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              className={cn(
                'dark:border-dark-gray',
                cartItems.length === 1
                  ? 'first:border-b'
                  : ' first:border-b-0',
              )}
            />
          )
        })}
      </div>
      <RecommendedProducts />
    </div>
  )
}
