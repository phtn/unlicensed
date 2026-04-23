export const ADMIN_MASTER_MONITOR_TOGGLE_EVENT =
  'rapidfire_admin_master_monitor_toggle'
export const ADMIN_MASTER_MONITOR_OPEN_EVENT =
  'rapidfire_admin_master_monitor_open'

export type AdminMasterMonitorToggleEvent = CustomEvent<void>
export type AdminMasterMonitorOpenEvent = CustomEvent<void>

declare global {
  interface WindowEventMap {
    [ADMIN_MASTER_MONITOR_TOGGLE_EVENT]: AdminMasterMonitorToggleEvent
    [ADMIN_MASTER_MONITOR_OPEN_EVENT]: AdminMasterMonitorOpenEvent
  }
}

export const createToggleAdminMasterMonitorEvent = () =>
  new CustomEvent<void>(ADMIN_MASTER_MONITOR_TOGGLE_EVENT)

export const createOpenAdminMasterMonitorEvent = () =>
  new CustomEvent<void>(ADMIN_MASTER_MONITOR_OPEN_EVENT)

export const toggleAdminMasterMonitor = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(createToggleAdminMasterMonitorEvent())
}

export const openAdminMasterMonitor = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(createOpenAdminMasterMonitorEvent())
}
