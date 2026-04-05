import {Card} from '@heroui/react'
import {SectionHeader} from './section-header'

export const AccessDenied = () => {
  return (
    <div className='flex items-center justify-center absolute top-1/2 left-1/2'>
      <Card className='w-96'>
        <SectionHeader
          title='Access Denied'
          description='You need admin privileges to access this page.'
        />
      </Card>
    </div>
  )
}
