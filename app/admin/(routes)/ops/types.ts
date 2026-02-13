import {Doc} from '@/convex/_generated/dataModel'

export type Order = Doc<'orders'>
export type OrderStatusCode = Order['orderStatus']
export type StatusCode = OrderStatusCode | 'default'
