import {isActiveStaffMember} from './staff-access'

export const MASTER_MONITOR_IDENTIFIER = 'masterMonitor'

type MasterMonitorSettingLike =
  | {
      value?: {
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

export function normalizeMasterMonitorEmail(
  email: string | null | undefined,
): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

export function getMasterMonitorEmails(
  setting: MasterMonitorSettingLike,
): string[] {
  const rawEmails = setting?.value?.emails

  if (!Array.isArray(rawEmails)) {
    return []
  }

  return [...new Set(rawEmails)]
    .map((email) =>
      typeof email === 'string' ? normalizeMasterMonitorEmail(email) : null,
    )
    .filter((email): email is string => Boolean(email))
}

export function parseMasterMonitorEmails(input: string): string[] {
  return [...new Set(input.split(/[\n,]/g))]
    .map((email) => normalizeMasterMonitorEmail(email))
    .filter((email): email is string => Boolean(email))
}

export function isMasterMonitorEmail(
  email: string | null | undefined,
  masterEmails: readonly string[],
): boolean {
  const normalizedEmail = normalizeMasterMonitorEmail(email)
  if (!normalizedEmail) return false

  return masterEmails.includes(normalizedEmail)
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
  return isActiveStaffMember(staff) && isMasterMonitorEmail(staff?.email, masterEmails)
}
