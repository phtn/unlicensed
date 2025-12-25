'use client'

import {PrimaryTab, ToolbarButtonWrapper} from '@/app/admin/@toolbar/components'
import {PageTitle} from '@/app/admin/_components/ui/page-title'
import {AnimatedNumber} from '@/components/ui/animated-number'
import {api} from '@/convex/_generated/api'
import {cn} from '@/lib/utils'
import {useQuery} from 'convex/react'
import Link from 'next/link'
import {Suspense} from 'react'

const StaffInner = () => {
  const staff = useQuery(api.staff.q.getStaff)
  // const [tabId] = useAdminTabId()

  return (
    <>
      <Link
        href='/admin/ops/staff'
        prefetch
        className='flex items-center space-x-4 group'>
        <PageTitle>Staff</PageTitle>
        <span
          className={cn(
            'px-1 h-6 w-6 text-center bg-pink-500 dark:bg-pink-500 text-white rounded-md font-space font-semibold',
          )}>
          <AnimatedNumber value={staff?.length ?? 0} />
        </span>
      </Link>
      <ToolbarButtonWrapper>
        <PrimaryTab
          id='new'
          href='/admin/ops/staff?tabId=new'
          icon='plus'
          label='New'
        />
      </ToolbarButtonWrapper>
    </>
  )
}

export const StaffTab = () => {
  return (
    <Suspense
      fallback={
        <div className='flex text-base items-center justify-between w-full px-2' />
      }>
      <StaffInner />
    </Suspense>
  )
}
