import {defineSchema, defineTable} from 'convex/server'
import {activitySchema} from './activities/d'
import {activityViewSchema} from './activityViews/d'
import {adminSettingsSchema} from './admin/d'
import {affiliateAccountSchema} from './affiliateAccounts/d'
import {blogSchema} from './blogs/d'
import {cartSchema} from './cart/d'
import {categorySchema} from './categories/d'
import {courierSchema} from './couriers/d'
import {checkoutLogSchema} from './checkoutLogs/d'
import {emailSettingsSchema} from './emailSettings/d'
import {logSchema} from './logs/d'
import {orderSchema} from './orders/d'
import {paygateAccountSchema} from './paygateAccounts/d'
import {productSchema} from './products/d'
import {rewardTierSchema, userRewardsSchema} from './rewards/d'
import {staffSchema} from './staff/d'
import {userSchema} from './users/d'

export default defineSchema({
  categories: defineTable(categorySchema)
    .index('by_slug', ['slug'])
    .index('by_visible', ['visible']),
  blogs: defineTable(blogSchema)
    .index('by_slug', ['slug'])
    .index('by_status', ['status']),
  products: defineTable(productSchema)
    .index('by_slug', ['slug'])
    .index('by_category', ['categorySlug'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['categorySlug'],
    }),
  staff: defineTable(staffSchema).index('by_email', ['email']),
  users: defineTable(userSchema).index('by_firebase_id', ['firebaseId']),
  carts: defineTable(cartSchema).index('by_user', ['userId']),
  orders: defineTable(orderSchema)
    .index('by_user', ['userId'])
    .index('by_order_number', ['orderNumber'])
    .index('by_status', ['orderStatus']),
  rewardTiers: defineTable(rewardTierSchema),
  userRewards: defineTable(userRewardsSchema).index('by_user', ['userId']),
  activities: defineTable(activitySchema)
    .index('by_user', ['userId'])
    .index('by_order', ['orderId'])
    .index('by_type', ['type'])
    .index('by_created_at', ['createdAt']),
  activityViews: defineTable(activityViewSchema)
    .index('by_activity', ['activityId'])
    .index('by_activity_user', ['activityId', 'userId']),
  adminSettings: defineTable(adminSettingsSchema).index('by_identifier', [
    'identifier',
  ]),
  couriers: defineTable(courierSchema)
    .index('by_code', ['code'])
    .index('by_active', ['active']),
  logs: defineTable(logSchema)
    .index('by_type', ['type'])
    .index('by_user', ['userId'])
    .index('by_path', ['path'])
    .index('by_created_at', ['createdAt']),
  emailSettings: defineTable(emailSettingsSchema)
    .index('by_title', ['title'])
    .index('by_intent', ['intent'])
    .index('by_group', ['group']),
  paygateAccounts: defineTable(paygateAccountSchema)
    .index('by_address_in', ['addressIn'])
    .index('by_hexAddress', ['hexAddress'])
    .index('by_default', ['isDefault']),
  affiliateAccounts: defineTable(affiliateAccountSchema).index(
    'by_wallet_address',
    ['walletAddress'],
  ),
  checkoutLogs: defineTable(checkoutLogSchema)
    .index('by_status', ['status'])
    .index('by_user', ['userId'])
    .index('by_order', ['orderId'])
    .index('by_created_at', ['createdAt']),
})
