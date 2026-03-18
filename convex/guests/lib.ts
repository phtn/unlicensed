import type {Doc, Id} from '../_generated/dataModel'
import type {MutationCtx, QueryCtx} from '../_generated/server'

type GuestLookupCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

export const getGuestByFid = async (
  ctx: GuestLookupCtx,
  fid: string,
): Promise<Doc<'guests'> | null> =>
  ctx.db
    .query('guests')
    .withIndex('by_fid', (q) => q.eq('fid', fid))
    .first()

export const getGuestByGuestId = async (
  ctx: GuestLookupCtx,
  guestId: string,
): Promise<Doc<'guests'> | null> =>
  ctx.db
    .query('guests')
    .withIndex('by_guestId', (q) => q.eq('guestId', guestId))
    .first()

export const getGuestById = async (
  ctx: GuestLookupCtx,
  id: string,
): Promise<Doc<'guests'> | null> =>
  (await ctx.db.get(id as Id<'guests'>)) as Doc<'guests'> | null
