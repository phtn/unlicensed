import type {Doc} from '../_generated/dataModel'
import type {MutationCtx, QueryCtx} from '../_generated/server'

type UserLookupCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

export const normalizeUserEmail = (email: string): string =>
  email.trim().toLowerCase()

export const normalizeUserFid = (fid: string): string => fid.trim()

const sortCanonicalUsers = (users: Doc<'users'>[]) =>
  [...users].sort((a, b) => {
    const createdDelta = a._creationTime - b._creationTime
    if (createdDelta !== 0) {
      return createdDelta
    }

    return String(a._id).localeCompare(String(b._id))
  })

const dedupeUsers = (users: Doc<'users'>[]) => {
  const seen = new Set<string>()
  const uniqueUsers: Doc<'users'>[] = []

  for (const user of users) {
    const id = String(user._id)
    if (seen.has(id)) {
      continue
    }

    seen.add(id)
    uniqueUsers.push(user)
  }

  return uniqueUsers
}

// Existing production data can contain duplicate identifiers. Always collect
// identity matches and choose a deterministic canonical row.
export const getCanonicalUserByFid = async (
  ctx: UserLookupCtx,
  fid: string,
): Promise<Doc<'users'> | null> => {
  const normalizedFid = normalizeUserFid(fid)
  if (!normalizedFid) {
    return null
  }

  const users = await ctx.db
    .query('users')
    .withIndex('by_fid', (q) => q.eq('fid', normalizedFid))
    .collect()

  return sortCanonicalUsers(users)[0] ?? null
}

export const getCanonicalUserByFirebaseId = async (
  ctx: UserLookupCtx,
  firebaseId: string,
): Promise<Doc<'users'> | null> => {
  const normalizedFirebaseId = normalizeUserFid(firebaseId)
  if (!normalizedFirebaseId) {
    return null
  }

  const users = await ctx.db
    .query('users')
    .withIndex('by_firebaseId', (q) =>
      q.eq('firebaseId', normalizedFirebaseId),
    )
    .collect()

  return sortCanonicalUsers(users)[0] ?? null
}

export const getCanonicalUserByEmail = async (
  ctx: UserLookupCtx,
  email: string,
): Promise<Doc<'users'> | null> => {
  const trimmedEmail = email.trim()
  if (!trimmedEmail) {
    return null
  }

  const normalizedEmail = normalizeUserEmail(trimmedEmail)
  const exactUsers = await ctx.db
    .query('users')
    .withIndex('by_email', (q) => q.eq('email', trimmedEmail))
    .collect()

  const normalizedUsers =
    normalizedEmail === trimmedEmail
      ? []
      : await ctx.db
          .query('users')
          .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
          .collect()

  const users = dedupeUsers([...exactUsers, ...normalizedUsers])

  return sortCanonicalUsers(users)[0] ?? null
}
