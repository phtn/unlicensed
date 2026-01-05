import {Icon} from '@/lib/icons'
import {Title} from '../base44/title'

export const EmptyCategory = () => {
  return (
    <div className='max-w-7xl mx-auto md:pt-10'>
      <div className=' flex flex-col items-center justify-center gap-4 px-6 py-10 md:py-24 text-center opacity-70'>
        <Title
          titleStyle='lowercase'
          title='Nothing here yet.'
          subtitle={
            <div className='flex items-center relative'>
              <Icon
                name='chevron-double-left'
                className='rotate-90 size-8 md:size-12 text-featured opacity-100 relative z-30'
              />
              <span>check back soon</span>
            </div>
          }
        />
      </div>
    </div>
  )
}
