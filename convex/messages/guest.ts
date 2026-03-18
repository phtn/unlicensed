import type {Doc} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'

const GUEST_FID_PREFIX = 'guest:'
const GUEST_EMAIL_DOMAIN = 'guest-chat.hyfe.local'

export const GUEST_DISPLAY_NAME = 'Guest'

export type GuestProfileInput = {
  displayName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

export const normalizeGuestId = (value: string) => value.trim()

export const buildGuestFid = (guestId: string) =>
  `${GUEST_FID_PREFIX}${guestId}`

const buildGuestEmail = (guestId: string) =>
  `guest+${guestId}@${GUEST_EMAIL_DOMAIN}`

const getUserByFid = async (ctx: MutationCtx, fid: string) =>
  ctx.db
    .query('users')
    .withIndex('by_fid', (q) => q.eq('fid', fid))
    .first()

export const getUserByGuestId = async (ctx: MutationCtx, guestId: string) =>
  ctx.db
    .query('users')
    .withIndex('by_guestId', (q) => q.eq('guestId', guestId))
    .first()

const trimOptionalValue = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const getGuestDisplayName = (
  profile: GuestProfileInput,
  currentName?: string | null,
) => {
  const explicitName = trimOptionalValue(profile.displayName)
  if (explicitName) {
    return explicitName
  }

  const existingName = trimOptionalValue(currentName)
  if (existingName && existingName !== GUEST_DISPLAY_NAME) {
    return existingName
  }

  const emailPrefix = trimOptionalValue(profile.contactEmail)?.split('@')[0]
  return emailPrefix || GUEST_DISPLAY_NAME
}

export const getOrCreateGuestUser = async (
  ctx: MutationCtx,
  guestId: string,
  profile: GuestProfileInput = {},
) => {
  const normalizedGuestId = normalizeGuestId(guestId)
  const guestFid = buildGuestFid(normalizedGuestId)
  const guestEmail = buildGuestEmail(normalizedGuestId)
  const contactEmail = trimOptionalValue(profile.contactEmail)
  const contactPhone = trimOptionalValue(profile.contactPhone)
  let guestUser =
    (await getUserByGuestId(ctx, normalizedGuestId)) ??
    (await getUserByFid(ctx, guestFid))

  if (guestUser) {
    const updates: Partial<Doc<'users'>> = {}
    const nextName = getGuestDisplayName(profile, guestUser.name)

    if (guestUser.guestId !== normalizedGuestId) {
      updates.guestId = normalizedGuestId
    }

    if (guestUser.fid !== guestFid) {
      updates.fid = guestFid
    }

    if (guestUser.email !== guestEmail) {
      updates.email = guestEmail
    }

    if (guestUser.name !== nextName) {
      updates.name = nextName
    }

    if (contactEmail && guestUser.contact?.alternateEmail !== contactEmail) {
      updates.contact = {
        ...guestUser.contact,
        alternateEmail: contactEmail,
      }
    }

    if (contactPhone && guestUser.contact?.phone !== contactPhone) {
      updates.contact = {
        ...(updates.contact ?? guestUser.contact),
        phone: contactPhone,
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(guestUser._id, {
        ...updates,
        updatedAt: Date.now(),
      })

      guestUser = (await ctx.db.get(guestUser._id)) ?? guestUser
    }

    return guestUser
  }

  const guestUserId = await ctx.db.insert('users', {
    email: guestEmail,
    name: getGuestDisplayName(profile),
    fid: guestFid,
    guestId: normalizedGuestId,
    ...(contactEmail || contactPhone
      ? {
          contact: {
            ...(contactEmail ? {alternateEmail: contactEmail} : {}),
            ...(contactPhone ? {phone: contactPhone} : {}),
          },
        }
      : {}),
    isActive: true,
    accountStatus: 'guest',
    notes: 'Guest chat session',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const createdGuestUser = await ctx.db.get(guestUserId)
  if (!createdGuestUser) {
    throw new Error('Failed to create guest chat user')
  }

  return createdGuestUser
}
