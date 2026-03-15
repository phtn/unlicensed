'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {PageTitle} from '../../_components/ui/page-title'
import {MainTab, ToolbarButtonWrapper, ToolbarWrapper} from '../components'

export const SettingsContent = () => {
  return (
    <ToolbarWrapper>
      <MainTab href='/admin/suppliers/settings'>
        <PageTitle>Settings</PageTitle>
        <div className='h-6 w-8 flex items-center justify-center aspect-square bg-foreground/8 rounded-md font-clash font-medium text-base md:text-lg'>
          <AnimatedNumber value={12} />
        </div>
      </MainTab>
      <ToolbarButtonWrapper></ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
