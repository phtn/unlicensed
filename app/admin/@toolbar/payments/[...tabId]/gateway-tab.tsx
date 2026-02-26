'use client'

import {
  MainTab,
  PrimaryTab,
  ToolbarButtonWrapper,
} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import type {GatewayId} from '@/lib/paygate/gateway-config'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'

interface GatewayTabProps {
  gateway: GatewayId
  title: string
  basePath: string
}

export const GatewayTab = ({gateway, title, basePath}: GatewayTabProps) => {
  const gateways = useQuery(api.gateways.q.list)

  return (
    <>
      <MainTab href={basePath}>
        <PageTitle>{title}</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center dark:bg-dark-gray rounded-md font-space font-semibold',
            'bg-dark-table dark:bg-sidebar/40 text-indigo-100',
          )}>
          <AnimatedNumber value={gateways?.length ?? 0} />
        </span>
      </MainTab>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          icon='plus'
          label='Account'
          href={`${basePath}/${gateway}?tabId=new`}
        />
      </ToolbarButtonWrapper>
    </>
  )
}
