'use client'

import {api} from '@/convex/_generated/api'
import {useAuthCtx} from '@/ctx/auth'
import {
  ADMIN_MASTER_MONITOR_OPEN_EVENT,
  ADMIN_MASTER_MONITOR_TOGGLE_EVENT,
} from '@/lib/admin-master-monitor'
import {
  canAccessMasterMonitor,
  getMasterMonitorEmails,
  getMasterMonitorEntries,
  getMasterTypeForEmail,
  MASTER_MONITOR_IDENTIFIER,
} from '@/lib/master-monitor-access'
import {useQuery} from 'convex/react'
import dynamic from 'next/dynamic'
import {useCallback, useEffect, useEffectEvent, useMemo, useState} from 'react'
import {HOTKEY_KEY} from './constants'

const DynamicAdminMasterMonitorDialog = dynamic(
  () =>
    import('./admin-master-monitor-dialog').then(
      (module) => module.AdminMasterMonitorDialog,
    ),
  {ssr: false},
)

export function AdminMasterMonitor() {
  const {user} = useAuthCtx()
  const [isOpen, setIsOpen] = useState(false)

  const currentStaff = useQuery(
    api.staff.q.getStaffByEmail,
    user?.email ? {email: user.email} : 'skip',
  )
  const masterMonitorSetting = useQuery(
    api.admin.q.getAdminByIdentifier,
    user?.email ? {identifier: MASTER_MONITOR_IDENTIFIER} : 'skip',
  )

  const masterEntries = useMemo(
    () => getMasterMonitorEntries(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const masterEmails = useMemo(
    () => getMasterMonitorEmails(masterMonitorSetting),
    [masterMonitorSetting],
  )
  const currentMasterType = useMemo(
    () => getMasterTypeForEmail(user?.email, masterEntries),
    [masterEntries, user?.email],
  )
  const hasMonitorAccess = useMemo(
    () =>
      canAccessMasterMonitor({
        staff: currentStaff,
        email: user?.email,
        masterEmails,
      }),
    [currentStaff, masterEmails, user?.email],
  )

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !hasMonitorAccess) return

      setIsOpen(nextOpen)
    },
    [hasMonitorAccess],
  )

  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.repeat) return
    if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return
    if (event.key.toLowerCase() !== HOTKEY_KEY) return

    event.preventDefault()

    if (!hasMonitorAccess) return

    setIsOpen((open) => !open)
  })

  const onToggleRequest = useEffectEvent(() => {
    if (!hasMonitorAccess) return

    setIsOpen((open) => !open)
  })

  const onOpenRequest = useEffectEvent(() => {
    if (!hasMonitorAccess) return

    setIsOpen(true)
  })

  useEffect(() => {
    document.addEventListener('keydown', onShortcut)

    return () => {
      document.removeEventListener('keydown', onShortcut)
    }
  }, [])

  useEffect(() => {
    window.addEventListener(ADMIN_MASTER_MONITOR_TOGGLE_EVENT, onToggleRequest)
    window.addEventListener(ADMIN_MASTER_MONITOR_OPEN_EVENT, onOpenRequest)

    return () => {
      window.removeEventListener(
        ADMIN_MASTER_MONITOR_TOGGLE_EVENT,
        onToggleRequest,
      )
      window.removeEventListener(ADMIN_MASTER_MONITOR_OPEN_EVENT, onOpenRequest)
    }
  }, [])

  const dialogOpen = isOpen && hasMonitorAccess

  return dialogOpen ? (
    <DynamicAdminMasterMonitorDialog
      currentMasterType={currentMasterType}
      masterEntries={masterEntries}
      onOpenChange={handleOpenChange}
      open={dialogOpen}
    />
  ) : null
}
