'use client'

import {MainWrapper} from '@/app/admin/_components/main-wrapper'
import {useAdminTabId} from '@/app/admin/_components/use-admin-tab'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {Suspense} from 'react'
import {EditStaff} from './edit-staff'
import {NewStaff} from './new-staff'
import {StaffList} from './staff-list'

const StaffContentInner = () => {
  const staff = useQuery(api.staff.q.getStaff)
  const [tabId, , id] = useAdminTabId()

  switch (tabId) {
    case 'new':
      return <NewStaff />
    case 'edit':
      if (!id) {
        return (
          <div className='py-4'>
            <h3 className='text-2xl tracking-tighter font-semibold px-2 mb-2'>
              Staff List
            </h3>
            <Suspense fallback={<div>Loading...</div>}>
              <StaffList staff={staff} />
            </Suspense>
          </div>
        )
      }
      return <EditStaff id={id as unknown as Id<'staff'>} />
    default:
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <StaffList staff={staff} />
        </Suspense>
      )
  }
}

export const Content = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MainWrapper>
        <div className='space-y-6'>
          <header className='hidden space-y-3'>
            <h1 className='text-2xl font-semibold'>Personnel</h1>
            <p className='max-w-3xl text-sm text-muted-foreground'>
              Manage staff members, roles, permissions, and personnel information.
            </p>
          </header>
          <StaffContentInner />
        </div>
      </MainWrapper>
    </Suspense>
  )
}
