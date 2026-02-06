import {cronJobs} from 'convex/server'
import {internal} from './_generated/api'

const crons = cronJobs()

crons.interval(
  'delete expired product holds',
  {minutes: 1},
  internal.productHolds.m.deleteExpiredHolds,
)

export default crons
