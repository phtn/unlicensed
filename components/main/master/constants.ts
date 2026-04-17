import type {MasterTabValue} from './types'

export const HOTKEY_KEY = 'm'
export const DEFAULT_MASTER_TAB: MasterTabValue = 'overview'

export const MASTER_TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'emails', label: 'Emails'},
  {id: 'settings', label: 'Settings'},
] as const satisfies readonly {id: MasterTabValue; label: string}[]

export const isMasterTabValue = (value: string): value is MasterTabValue =>
  MASTER_TABS.some((tab) => tab.id === value)
