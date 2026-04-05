import {PendingDealsSection} from '@/app/lobby/(store)/deals/components/pending-deals-section'
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
    <div className='min-w-0 md:h-[88lvh] h-fit bg-linear-to-b dark:from-dark-table/40 via-transparent to-transparent rounded-none overflow-hidden flex flex-col'>
      <div className='flex-1 min-w-0 overflow-x-hidden overflow-y-auto rounded-xs w-full'>
        <PendingDealsSection cartItems={cartItems} />
        {cartItems.map((item) => {
          const product = item.product
          const itemPrice =
            item.lineTotalCents != null
              ? Math.round(item.lineTotalCents / item.quantity)
              : getUnitPriceCents(product, item.denomination)

          return (
            <CartItem
              key={`${product._id}-${item.denomination ?? 'default'}-${item.bundleCartItemIndex ?? 'p'}-${item.bundleLineIndex ?? ''}`}
              item={item}
              itemPrice={itemPrice}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              className={cn(
                'dark:border-dark-gray',
                cartItems.length === 1 ? 'first:border-b' : ' first:border-b-0',
              )}
            />
          )
        })}
      </div>
      <RecommendedProducts />
    </div>
  )
}
