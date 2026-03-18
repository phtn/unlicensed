import type {Doc} from '../_generated/dataModel'
import type {MutationCtx, QueryCtx} from '../_generated/server'

type UserLookupCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

// Existing production data can contain duplicate `fid` or `email` rows.
// `.first()` keeps lookups stable because Convex uses `_creationTime` as the
// final tie breaker for index ordering.
export const getCanonicalUserByFid = async (
  ctx: UserLookupCtx,
  fid: string,
): Promise<Doc<'users'> | null> =>
  ctx.db
    .query('users')
    .withIndex('by_fid', (q) => q.eq('fid', fid.trim()))
    .first()

export const getCanonicalUserByEmail = async (
  ctx: UserLookupCtx,
  email: string,
): Promise<Doc<'users'> | null> =>
  ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', email))
    .first()
