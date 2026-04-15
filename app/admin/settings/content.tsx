'use client'

import {MainWrapper} from '../_components/main-wrapper'
import {SettingsTabs} from './tabs'

export const Content = () => {
  return (
    <MainWrapper className='overflow-hidden whitespace-normal p-0! lg:px-4 sm:py-4 lg:p-4'>
      <SettingsTabs />
    </MainWrapper>
  )
}
