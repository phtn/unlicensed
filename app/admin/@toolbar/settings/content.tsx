'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import {ViewTransition} from 'react'
import {PageTitle} from '../../_components/ui/page-title'
import {
  MainTab,
  PrimaryTab,
  ToolbarButtonWrapper,
  ToolbarWrapper,
} from '../components'

export const SettingsContent = () => {
  const settings = useQuery(api.admin.q.listAdminSettings)
  return (
    <ToolbarWrapper>
      <MainTab href='/admin/suppliers/settings'>
        <PageTitle>Settings</PageTitle>
        <ViewTransition>
          {settings ? (
            <div className='size-6 flex items-center justify-center aspect-square bg-foreground/8 rounded-md font-space font-medium text-base md:text-lg'>
              <AnimatedNumber value={settings?.length} />
            </div>
          ) : (
            <Icon name='spinners-ring' className='size-4' />
          )}
        </ViewTransition>
      </MainTab>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/settings?tabId=new'
          icon='plus'
          label='New Setting'
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
