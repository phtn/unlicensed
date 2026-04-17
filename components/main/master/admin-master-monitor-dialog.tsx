'use client'

import {Icon} from '@/lib/icons'
import type {MasterEntry} from '@/lib/master-monitor-access'
import {Tabs} from '@base-ui/react'
import {useCallback, useState} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog'
import {DEFAULT_MASTER_TAB, isMasterTabValue} from './constants'
import {EmailsPanel} from './emails-panel'
import {MasterTabs} from './master-tabs'
import {SettingsPanel} from './settings-panel'
import {StatsGridPanel} from './stats-grid-panel'
import type {MasterTabValue} from './types'

interface AdminMasterMonitorDialogProps {
  currentMasterType: MasterEntry['type'] | null
  masterEntries: MasterEntry[]
  onOpenChange: (open: boolean) => void
  open: boolean
}

export const AdminMasterMonitorDialog = ({
  currentMasterType,
  masterEntries,
  onOpenChange,
  open,
}: AdminMasterMonitorDialogProps) => {
  const [activeTab, setActiveTab] =
    useState<MasterTabValue>(DEFAULT_MASTER_TAB)

  const canManageAdminClaims =
    currentMasterType === 'OG' || currentMasterType === 'TOP-G'

  const handleTabChange = useCallback((tab: string) => {
    if (!isMasterTabValue(tab)) return

    setActiveTab(tab)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='z-9999 max-w-[calc(100vw-1rem)] gap-0 overflow-hidden bg-background/95 dark:bg-dark-table/40 backdrop-blur-xl p-0 shadow-2xl sm:max-w-4xl'>
        <DialogHeader className='gap-3 bg-linear-to-b from-dark-table via-dark-table to-dark-table dark:from-background/80 dark:via-background dark:to-background p-3 text-left'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center leading-none space-x-1 relative'>
              <Icon
                name='master'
                className='size-6! shrink-0 text-orange-300 absolute top-0.5'
              />
              <div className='ml-6'>
                <DialogTitle className='font-polysans text-white text-lg tracking-wide'>
                  Master
                </DialogTitle>
                <DialogDescription />
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <div className='flex min-h-144 flex-col'>
            <MasterTabs />

            <div className='min-h-0 flex-1'>
              <StatsGridPanel enabled={activeTab === 'overview'} />
              <EmailsPanel enabled={activeTab === 'emails'} />
              <SettingsPanel
                canManageAdminClaims={canManageAdminClaims}
                enabled={activeTab === 'settings'}
                masterEntries={masterEntries}
              />
            </div>
          </div>
        </Tabs.Root>
      </DialogContent>
    </Dialog>
  )
}
