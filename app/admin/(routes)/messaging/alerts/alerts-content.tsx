'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {SectionHeader} from '@/app/admin/_components/ui/section-header'
import {LowStockEmailAlertsPanel} from './low-stock-email-alerts-panel'

export const Content = () => {
  return (
    <MainWrapper className='border-t-0'>
      <div className='py-2'>
        <SectionHeader title={'Manage Alerts & Notifications'} />
        <div className='py-2'>
          <LowStockEmailAlertsPanel />
        </div>
      </div>
    </MainWrapper>
  )
}
