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
            <p className='text-[14px] capitalize tracking-tight -space-y-1 [word-spacing:100vw]'>
              {label.split(' ').map((word) => (
                <div
                  className='first:opacity-60 last:font-bold last:text-xl'
                  key={word}>
                  {word}
                </div>
              ))}
            </p>
          </div>

          <div className='text-brand'>
            <Icon name={icon} className='size-8 opacity-80' />
          </div>
        </div>
        <div className='size-full flex flex-1 justify-end p-4'>
          <p className='text-2xl font-medium tracking-tight'>{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}
