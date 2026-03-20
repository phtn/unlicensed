'use client'

import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {useMobile} from '@/hooks/use-mobile'
import {Icon} from '@/lib/icons'
import {useQuery} from 'convex/react'
import {ViewTransition} from 'react'
import {PageTitle} from '../../_components/ui/page-title'
import {
  MainTab,
  PrimaryTab,
  SecondaryTab,
  ToolbarButtonWrapper,
  ToolbarWrapper,
} from '../components'

export const MessagingContent = () => {
  const templates = useQuery(api.emailSettings.q.listEmailSettings)
  const isMobile = useMobile()
  return (
    <ToolbarWrapper>
      <MainTab href='/admin/messaging/email'>
        <PageTitle>Messaging</PageTitle>
        <ViewTransition>
          {templates ? (
            <div className='size-6 flex items-center justify-center aspect-square bg-foreground/8 rounded-md font-space font-medium text-base md:text-lg'>
              <AnimatedNumber value={templates?.length} />
            </div>
          ) : (
            <Icon name='spinners-ring' className='size-4' />
          )}
        </ViewTransition>
      </MainTab>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='mailing-list'
          href='/admin/messaging/email?tabId=mailing-list'
          icon='mail-send-fill'
          label='Mailing List'
        />
        <SecondaryTab
          id='templates'
          href='/admin/messaging/email?tabId=templates'
          icon='gallery-edit-bold'
          label='Templates'
        />
        <PrimaryTab
          id='new'
          href='/admin/messaging/email?tabId=new'
          icon='plus'
          label={isMobile ? 'New' : 'New Template'}
        />
      </ToolbarButtonWrapper>
    </ToolbarWrapper>
  )
}
