import {cronJobs} from 'convex/server'
import {internal} from './_generated/api'

const crons = cronJobs()

crons.interval(
  'delete expired product holds',
  {minutes: 1},
  internal.productHolds.m.deleteExpiredHolds,
)

crons.interval(
  'retry pending payment emails',
  {minutes: 10},
  internal.orders.a.retryPendingPaymentEmails,
  {limit: 25},
)

crons.interval(
  'retry payment success emails',
  {minutes: 10},
  internal.orders.a.retryPendingPaymentSuccessEmails,
  {limit: 25},
)

export default crons
