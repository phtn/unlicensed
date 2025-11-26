import {Icon, IconName} from '@/lib/icons'
import {Card, CardBody} from '@heroui/react'

interface UserStatsCardProps {
  label: string
  value: number | string
  icon: IconName
}

export const UserStatsCard = ({label, value, icon}: UserStatsCardProps) => {
  return (
    <Card shadow='sm'>
      <CardBody className='p-0 bg-sidebar border-sidebar'>
        <div className='p-4 flex items-start justify-between size-full'>
          <div>
            <p className='text-sm capitalize tracking-tight'>{label}</p>
          </div>

          <div className='text-primary'>
            <Icon name={icon} className='size-6 opacity-80' />
          </div>
        </div>
        <div className='size-full flex flex-1 justify-end p-4'>
          <p className='text-2xl font-medium tracking-tight'>{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}
