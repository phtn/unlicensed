import type {Doc} from '../_generated/dataModel'
import type {MutationCtx} from '../_generated/server'
import {getGuestByFid, getGuestByGuestId} from '../guests/lib'

const GUEST_FID_PREFIX = 'guest:'
const GUEST_EMAIL_DOMAIN = 'guest-chat.rapidfire.local'

export const GUEST_DISPLAY_NAME = 'Guest'
const GUEST_DISPLAY_NAME_PREFIX = `${GUEST_DISPLAY_NAME} `

export type GuestProfileInput = {
  displayName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  visitorId?: string | null
  deviceFingerprintId?: string | null
}

export const normalizeGuestId = (value: string) => value.trim()

export const buildGuestFid = (guestId: string) =>
  `${GUEST_FID_PREFIX}${guestId}`

export const parseGuestIdFromFid = (fid: string) => {
  const normalizedFid = fid.trim()

  if (!normalizedFid.startsWith(GUEST_FID_PREFIX)) {
    return null
  }

  return normalizeGuestId(normalizedFid.slice(GUEST_FID_PREFIX.length))
}

const buildGuestEmail = (guestId: string) =>
  `guest+${guestId}@${GUEST_EMAIL_DOMAIN}`

export const getGuestByFidRef = (ctx: MutationCtx, fid: string) =>
  getGuestByFid(ctx, fid)

export const getGuestByGuestIdRef = (ctx: MutationCtx, guestId: string) =>
  getGuestByGuestId(ctx, guestId)

const trimOptionalValue = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const getGuestDisplayName = (
  profile: GuestProfileInput,
  currentName?: string | null,
) => {
  const explicitName = trimOptionalValue(profile.displayName)
  const existingName = trimOptionalValue(currentName)

  if (
    explicitName &&
    (!existingName ||
      existingName === GUEST_DISPLAY_NAME ||
      existingName.startsWith(GUEST_DISPLAY_NAME_PREFIX))
  ) {
    return explicitName
  }

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
  const visitorId = trimOptionalValue(profile.visitorId)
  const deviceFingerprintId = trimOptionalValue(profile.deviceFingerprintId)
  let guestUser =
    (await getGuestByGuestId(ctx, normalizedGuestId)) ??
    (await getGuestByFid(ctx, guestFid))

  if (guestUser) {
    const updates: Partial<Doc<'guests'>> = {}
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

    if (visitorId && guestUser.visitorId !== visitorId) {
      updates.visitorId = visitorId
    }

    if (
      deviceFingerprintId &&
      guestUser.deviceFingerprintId !== deviceFingerprintId
    ) {
      updates.deviceFingerprintId = deviceFingerprintId
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

  const guestUserId = await ctx.db.insert('guests', {
    email: guestEmail,
    name: getGuestDisplayName(profile),
    fid: guestFid,
    guestId: normalizedGuestId,
    ...(visitorId ? {visitorId} : {}),
    ...(deviceFingerprintId ? {deviceFingerprintId} : {}),
    ...(contactEmail || contactPhone
      ? {
          contact: {
            ...(contactEmail ? {alternateEmail: contactEmail} : {}),
            ...(contactPhone ? {phone: contactPhone} : {}),
          },
        }
      : {}),
    isActive: true,
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
