import {defineSchema, defineTable} from 'convex/server'
import {categorySchema} from './categories/d'
import {productSchema} from './products/d'
import {userSchema} from './users/d'
import {cartSchema} from './cart/d'
import {orderSchema} from './orders/d'
import {rewardTierSchema, userRewardsSchema} from './rewards/d'

export default defineSchema({
  categories: defineTable(categorySchema).index('by_slug', ['slug']),
  products: defineTable(productSchema)
    .index('by_slug', ['slug'])
    .index('by_category', ['categorySlug'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['categorySlug'],
    }),
  users: defineTable(userSchema).index('by_firebase_id', ['firebaseId']),
  carts: defineTable(cartSchema).index('by_user', ['userId']),
  orders: defineTable(orderSchema)
    .index('by_user', ['userId'])
    .index('by_order_number', ['orderNumber'])
    .index('by_status', ['orderStatus']),
  rewardTiers: defineTable(rewardTierSchema),
  userRewards: defineTable(userRewardsSchema).index('by_user', ['userId']),
})
