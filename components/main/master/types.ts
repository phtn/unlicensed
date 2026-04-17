export interface MonitorStat {
  label: string
  value: string
  description: string
  toneClassName: string
}

export type MasterTabValue = 'overview' | 'emails' | 'settings'
