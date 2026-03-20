'use client'

import {MainWrapper} from '../_components/main-wrapper'
import {SettingsTabs} from './tabs'

export const Content = () => {
  return (
    <MainWrapper className='min-w-0 max-w-full overflow-hidden whitespace-normal px-0 sm:px-4 sm:py-4 md:p-4'>
      <SettingsTabs />
    </MainWrapper>
  )
}
