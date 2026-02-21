'use client'

import {
  MainTab,
  PrimaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {api} from '@/convex/_generated/api'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import {AnimatedNumber} from '@/components/ui/animated-number'

interface GatewayTabProps {
  gateway: GatewayId
  title: string
  basePath: string
}

export const GatewayTab = ({gateway, title, basePath}: GatewayTabProps) => {
  const accounts = useQuery(api.paygateAccounts.q.listAccounts, {gateway})

  return (
    <>
      <MainTab href={basePath}>
        <PageTitle>{title}</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray bg-dark-gray/10 rounded-md font-space font-semibold',
            'bg-sidebar/50 dark:bg-sidebar/40 text-indigo-500',
          )}>
          <AnimatedNumber value={accounts?.length ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          icon='plus'
          label='Wallet'
          href={`${basePath}?tabId=new`}
        />
      </ToolbarButtonWrapper>
    </>
  )
}
