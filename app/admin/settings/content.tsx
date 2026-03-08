'use client'

import {MainWrapper} from '../_components/main-wrapper'
import {SettingsTabs} from './tabs'

export const Content = () => {
  return (
    <MainWrapper className='px-3 py-3 sm:px-4 sm:py-4 md:p-4'>
      <SettingsTabs />
    </MainWrapper>
  )
}
