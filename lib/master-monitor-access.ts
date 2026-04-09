import {isActiveStaffMember} from './staff-access'

export const MASTER_MONITOR_IDENTIFIER = 'masterMonitor'
export const DEFAULT_OG_MASTER_EMAIL = 'phtn458@gmail.com'
export const MASTER_TYPES = ['OG', 'TOP-G', 'SB'] as const

export type MasterType = (typeof MASTER_TYPES)[number]
export type MasterEntry = {
  email: string
  type: MasterType
}

export type MasterRosterChange = {
  added: MasterEntry[]
  removed: MasterEntry[]
  retagged: Array<{
    previous: MasterEntry
    next: MasterEntry
  }>
}

export type MasterRosterChangeAuthorization = {
  allowed: boolean
  actorType: MasterType | null
  isDefaultOg: boolean
  reason: string | null
  change: MasterRosterChange
}

type MasterMonitorSettingLike =
  | {
      value?: {
        masters?: unknown
        emails?: unknown
      } | null
    }
  | null
  | undefined

type StaffLike =
  | {
      active?: boolean | null
      email?: string | null
    }
  | null
  | undefined

const MASTER_TYPE_PRIORITY: Record<MasterType, number> = {
  OG: 3,
  'TOP-G': 2,
  SB: 1,
}

export const DEFAULT_OG_MASTER_ENTRY: MasterEntry = {
  email: DEFAULT_OG_MASTER_EMAIL,
  type: 'OG',
}

export function normalizeMasterMonitorEmail(
  email: string | null | undefined,
): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

export function normalizeMasterType(type: string | null | undefined): MasterType {
  if (type === 'OG' || type === 'TOP-G' || type === 'SB') {
    return type
  }

  return 'SB'
}

function normalizeMasterEntry(entry: unknown): MasterEntry | null {
  if (!entry || typeof entry !== 'object') {
    return null
  }

  const candidate = entry as Record<string, unknown>
  const email =
    typeof candidate.email === 'string'
      ? normalizeMasterMonitorEmail(candidate.email)
      : null

  if (!email) {
    return null
  }

  return {
    email,
    type:
      typeof candidate.type === 'string'
        ? normalizeMasterType(candidate.type)
        : 'SB',
  }
}

function dedupeMasterEntries(entries: readonly MasterEntry[]): MasterEntry[] {
  const byEmail = new Map<string, MasterEntry>()

  for (const entry of entries) {
    const existing = byEmail.get(entry.email)
    if (
      !existing ||
      MASTER_TYPE_PRIORITY[entry.type] > MASTER_TYPE_PRIORITY[existing.type]
    ) {
      byEmail.set(entry.email, entry)
    }
  }

  return [...byEmail.values()].sort((left, right) =>
    left.email.localeCompare(right.email),
  )
}

export function getStoredMasterMonitorEntries(
  setting: MasterMonitorSettingLike,
): MasterEntry[] {
  const rawMasters = setting?.value?.masters
  if (Array.isArray(rawMasters)) {
    return dedupeMasterEntries(
      rawMasters
        .map((entry) => normalizeMasterEntry(entry))
        .filter((entry): entry is MasterEntry => Boolean(entry)),
    )
  }

  const rawEmails = setting?.value?.emails
  if (Array.isArray(rawEmails)) {
    return dedupeMasterEntries(
      rawEmails
        .map((email) =>
          typeof email === 'string'
            ? normalizeMasterMonitorEmail(email)
            : null,
        )
        .filter((email): email is string => Boolean(email))
        .map((email) => ({email, type: 'SB' as const})),
    )
  }

  return []
}

export function getMasterMonitorEntries(
  setting: MasterMonitorSettingLike,
): MasterEntry[] {
  return [
    DEFAULT_OG_MASTER_ENTRY,
    ...dedupeMasterEntries(
      getStoredMasterMonitorEntries(setting).filter(
        (entry) => entry.email !== DEFAULT_OG_MASTER_EMAIL,
      ),
    ),
  ]
}

export function serializeMasterMonitorEntries(
  entries: readonly MasterEntry[],
): MasterEntry[] {
  return dedupeMasterEntries(
    entries
      .map((entry) => normalizeMasterEntry(entry))
      .filter((entry): entry is MasterEntry => Boolean(entry))
      .filter((entry) => entry.email !== DEFAULT_OG_MASTER_EMAIL),
  )
}

export function getMasterMonitorEmails(
  setting: MasterMonitorSettingLike,
): string[] {
  return getMasterMonitorEntries(setting).map((entry) => entry.email)
}

export function getMasterTypeForEmail(
  email: string | null | undefined,
  entries: readonly MasterEntry[],
): MasterType | null {
  const normalizedEmail = normalizeMasterMonitorEmail(email)
  if (!normalizedEmail) return null

  const entry = entries.find((candidate) => candidate.email === normalizedEmail)
  return entry?.type ?? null
}

export function isMasterMonitorEmail(
  email: string | null | undefined,
  masterEmails: readonly string[],
): boolean {
  const normalizedEmail = normalizeMasterMonitorEmail(email)
  if (!normalizedEmail) return false

  return masterEmails.includes(normalizedEmail)
}

export function canManageMasterMonitor(
  email: string | null | undefined,
): boolean {
  return normalizeMasterMonitorEmail(email) === DEFAULT_OG_MASTER_EMAIL
}

function toMasterEntryMap(
  entries: readonly MasterEntry[],
): Map<string, MasterEntry> {
  return new Map(entries.map((entry) => [entry.email, entry]))
}

export function canAddMasterMonitorEntries(
  email: string | null | undefined,
): boolean {
  return canManageMasterMonitor(email)
}

export function canRetagMasterMonitorEntries(
  email: string | null | undefined,
): boolean {
  return canManageMasterMonitor(email)
}

export function canDisableMasterMonitorEntry({
  actorEmail,
  target,
  entries,
}: {
  actorEmail: string | null | undefined
  target: MasterEntry
  entries: readonly MasterEntry[]
}): boolean {
  const normalizedTargetEmail = normalizeMasterMonitorEmail(target.email)
  if (!normalizedTargetEmail || normalizedTargetEmail === DEFAULT_OG_MASTER_EMAIL) {
    return false
  }

  if (canManageMasterMonitor(actorEmail)) {
    return true
  }

  const actorType = getMasterTypeForEmail(actorEmail, entries)
  if (actorType === 'OG') {
    return target.type === 'TOP-G' || target.type === 'SB'
  }

  if (actorType === 'TOP-G') {
    return target.type === 'SB'
  }

  return false
}

export function getMasterRosterChange({
  currentEntries,
  nextEntries,
}: {
  currentEntries: readonly MasterEntry[]
  nextEntries: readonly MasterEntry[]
}): MasterRosterChange {
  const currentByEmail = toMasterEntryMap(currentEntries)
  const nextByEmail = toMasterEntryMap(nextEntries)

  const added = nextEntries.filter((entry) => !currentByEmail.has(entry.email))
  const removed = currentEntries.filter((entry) => !nextByEmail.has(entry.email))
  const retagged = currentEntries.flatMap((entry) => {
    const nextEntry = nextByEmail.get(entry.email)
    if (!nextEntry || nextEntry.type === entry.type) {
      return []
    }

    return [{previous: entry, next: nextEntry}]
  })

  return {
    added,
    removed,
    retagged,
  }
}

export function getMasterRosterChangeAuthorization({
  actorEmail,
  currentEntries,
  nextEntries,
}: {
  actorEmail: string | null | undefined
  currentEntries: readonly MasterEntry[]
  nextEntries: readonly MasterEntry[]
}): MasterRosterChangeAuthorization {
  const actorType = getMasterTypeForEmail(actorEmail, currentEntries)
  const isDefaultOg = canManageMasterMonitor(actorEmail)
  const change = getMasterRosterChange({currentEntries, nextEntries})

  const hasChanges =
    change.added.length > 0 ||
    change.removed.length > 0 ||
    change.retagged.length > 0

  if (!hasChanges) {
    return {
      allowed: true,
      actorType,
      isDefaultOg,
      reason: null,
      change,
    }
  }

  if (isDefaultOg) {
    return {
      allowed: true,
      actorType,
      isDefaultOg,
      reason: null,
      change,
    }
  }

  if (change.added.length > 0 || change.retagged.length > 0) {
    return {
      allowed: false,
      actorType,
      isDefaultOg,
      reason: 'Only the default OG can add or retag masters.',
      change,
    }
  }

  if (actorType === 'OG') {
    const blockedRemoval = change.removed.find(
      (entry) =>
        !canDisableMasterMonitorEntry({
          actorEmail,
          target: entry,
          entries: currentEntries,
        }),
    )

    return {
      allowed: !blockedRemoval,
      actorType,
      isDefaultOg,
      reason: blockedRemoval
        ? 'OG masters can only disable TOP-G and SB entries.'
        : null,
      change,
    }
  }

  if (actorType === 'TOP-G') {
    const blockedRemoval = change.removed.find(
      (entry) =>
        !canDisableMasterMonitorEntry({
          actorEmail,
          target: entry,
          entries: currentEntries,
        }),
    )

    return {
      allowed: !blockedRemoval,
      actorType,
      isDefaultOg,
      reason: blockedRemoval
        ? 'TOP-G masters can only disable SB entries.'
        : null,
      change,
    }
  }

  return {
    allowed: false,
    actorType,
    isDefaultOg,
    reason: 'SB masters are read-only.',
    change,
  }
}

export function canAccessMasterMonitor({
  staff,
  email,
  masterEmails,
}: {
  staff: StaffLike
  email: string | null | undefined
  masterEmails: readonly string[]
}): boolean {
  return isActiveStaffMember(staff) && isMasterMonitorEmail(email, masterEmails)
}

export function canStaffRecordAccessMasterMonitor(
  staff: StaffLike,
  masterEmails: readonly string[],
): boolean {
  return (
    isActiveStaffMember(staff) && isMasterMonitorEmail(staff?.email, masterEmails)
  )
}
