import {defineSchema, defineTable} from 'convex/server'
import {activitySchema} from './activities/d'
import {activityViewSchema} from './activityViews/d'
import {addressRecordSchema} from './addresses/d'
import {adminSettingsSchema} from './admin/d'
import {affiliateAccountSchema} from './affiliateAccounts/d'
import {archivedConversationSchema} from './archives/d'
import {blogSchema} from './blogs/d'
import {cartSchema} from './cart/d'
import {categorySchema} from './categories/d'
import {checkoutLogSchema} from './checkoutLogs/d'
import {courierSchema} from './couriers/d'
import {emailSettingsSchema} from './emailSettings/d'
import {fileSchema} from './files/upload'
import {followSchema} from './follows/d'
import {logSchema} from './logs/d'
import {messageSchema} from './messages/d'
import {notificationSchema} from './notifications/d'
import {orderSchema} from './orders/d'
import {paygateAccountSchema} from './paygateAccounts/d'
import {productHoldSchema} from './productHolds/d'
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
  users: defineTable(userSchema)
    .index('by_fid', ['fid'])
    .index('by_email', ['email']),
  addresses: defineTable(addressRecordSchema)
    .index('by_user', ['userId'])
    .index('by_user_type', ['userId', 'type'])
    .index('by_user_address_id', ['userId', 'id'])
    .index('by_user_updated_at', ['userId', 'updatedAt']),
  carts: defineTable(cartSchema).index('by_user', ['userId']),
  productHolds: defineTable(productHoldSchema)
    .index('by_cart', ['cartId'])
    .index('by_product_denom', ['productId', 'denomination'])
    .index('by_expires', ['expiresAt']),
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

  messages: defineTable(messageSchema)
    .index('by_sender', ['senderId']) // All messages sent by a user
    .index('by_receiver', ['receiverId']) // All messages received by a user
    .index('by_sender_receiver', ['senderId', 'receiverId']) // Messages between two specific users
    .index('by_receiver_sender', ['receiverId', 'senderId']), // Messages between two specific users (reverse)

  archivedConversations: defineTable(archivedConversationSchema)
    .index('by_userId', ['userId'])
    .index('by_userId_otherUserId', ['userId', 'otherUserId']),

  follows: defineTable(followSchema)
    .index('by_follower', ['followerId']) // All users that a user follows
    .index('by_followed', ['followedId']) // All followers of a user
    .index('by_follower_followed', ['followerId', 'followedId']), // Check if specific follow relationship exists

  notifications: defineTable(notificationSchema)
    .index('by_uid', ['uid']) // All notifications for a user
    .index('by_user_read', ['uid', 'readAt']) // Notifications by user and read status
    .index('by_user_created', ['uid', 'createdAt']), // Notifications by user sorted by creation time
  files: defineTable(fileSchema)
    .index('by_body', ['body'])
    .index('by_author', ['author']),
})
