import {v} from 'convex/values'
import type {Doc, Id} from '../_generated/dataModel'
import type {MutationCtx, QueryCtx} from '../_generated/server'
import {getGuestByFid, getGuestByGuestId} from '../guests/lib'
import {getCanonicalUserByFid} from '../users/lib'
import {buildGuestFid, parseGuestIdFromFid} from './guest'

type ParticipantLookupCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>

export const chatParticipantIdValidator = v.union(
  v.id('users'),
  v.id('guests'),
)

export type ChatParticipantDoc = Doc<'users'> | Doc<'guests'>
export type ChatParticipantId = Id<'users'> | Id<'guests'>

export const isGuestParticipant = (
  participant: ChatParticipantDoc | null,
): participant is Doc<'guests'> =>
  !!participant && 'guestId' in participant && 'fid' in participant

export const getChatParticipantById = async (
  ctx: ParticipantLookupCtx,
  participantId: ChatParticipantId,
): Promise<ChatParticipantDoc | null> =>
  ctx.db.get(participantId)

export const getChatParticipantByFid = async (
  ctx: ParticipantLookupCtx,
  fid: string,
): Promise<ChatParticipantDoc | null> => {
  const normalizedFid = fid.trim()
  if (!normalizedFid) {
    return null
  }

  const user = await getCanonicalUserByFid(ctx, normalizedFid)
  if (user) {
    return user
  }

  const guest = await getGuestByFid(ctx, normalizedFid)
  if (guest) {
    return guest
  }

  const guestId = parseGuestIdFromFid(normalizedFid)
  if (!guestId) {
    return null
  }

  return getGuestByGuestId(ctx, guestId)
}

export const getChatParticipantFid = (participant: ChatParticipantDoc) =>
  isGuestParticipant(participant)
    ? participant.fid
    : participant.fid ?? participant.firebaseId ?? ''

export const getChatParticipantEmail = (participant: ChatParticipantDoc) =>
  isGuestParticipant(participant)
    ? participant.contact?.alternateEmail?.trim() || participant.email || ''
    : participant.email || ''

export const getChatParticipantDisplayName = (
  participant: ChatParticipantDoc,
) => participant.name ?? getChatParticipantEmail(participant).split('@')[0] ?? ''

export const getChatParticipantPhotoUrl = (participant: ChatParticipantDoc) =>
  participant.photoUrl ?? null

export const getChatParticipantLocationLabel = (
  participant: ChatParticipantDoc,
) => {
  const city = participant.city?.trim() || null
  const countryCode = participant.countryCode?.trim().toUpperCase() || null
  const country = participant.country?.trim() || null

  if (city && countryCode) {
    return `${city}, ${countryCode}`
  }

  if (city && country) {
    return `${city}, ${country}`
  }

  return city ?? country ?? countryCode ?? null
}

export const getGuestFidFromGuestId = (guestId: string) =>
  buildGuestFid(guestId.trim())
