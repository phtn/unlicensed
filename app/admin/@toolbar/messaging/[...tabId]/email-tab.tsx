'use client'

import {
  MainTab,
  SecondaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'

const EmailTabInner = () => {
  const templates = useQuery(api.emailSettings.q.listEmailSettings)

  return (
    <>
      <MainTab href='/admin/messaging/email'>
        <PageTitle>Email Templates</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
          )}>
          <AnimatedNumber value={templates?.length ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <SecondaryTab
          id='new'
          href='/admin/messaging/email?tabId=new'
          icon='plus'
          label='New Template'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const EmailTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <EmailTabInner />
    </Suspense>
  )
}
