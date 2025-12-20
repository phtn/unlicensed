'use client'

import {StaffForm, StaffFormValues} from '@/app/admin/(routes)/ops/staff/staff-form'
import {api} from '@/convex/_generated/api'
import {Id} from '@/convex/_generated/dataModel'
import {useQuery} from 'convex/react'
import {useRouter} from 'next/navigation'

interface EditStaffProps {
  id: Id<'staff'>
}

export const EditStaff = ({id}: EditStaffProps) => {
  const router = useRouter()
  const staff = useQuery(api.staff.q.getStaffMember, id ? {id} : 'skip')

  if (staff === undefined) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Loading staff member...</p>
      </div>
    )
  }

  if (staff === null) {
    return (
      <div className='flex items-center justify-center h-[calc(100vh-6rem)]'>
        <p className='text-neutral-500'>Staff member not found</p>
      </div>
    )
  }

  // Convert staff data to form values
  const initialValues: StaffFormValues = {
    email: staff.email ?? '',
    name: staff.name ?? '',
    position: staff.position ?? '',
    accessRoles: staff.accessRoles ?? [],
    active: staff.active ?? true,
  }

  const handleUpdated = () => {
    // Navigate back to the staff list after successful update
    router.push('/admin/ops/staff')
  }

  return (
    <StaffForm
      key={staff._id}
      staffId={staff._id}
      initialValues={initialValues}
      onUpdated={handleUpdated}
    />
  )
}

